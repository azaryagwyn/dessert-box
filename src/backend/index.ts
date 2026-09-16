import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  MIDTRANS_SERVER_KEY?: string;
  MIDTRANS_CLIENT_KEY?: string;
  MIDTRANS_IS_PRODUCTION?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// Health check
app.get("/api/health", (c) => c.json({ status: "ok", timestamp: Date.now() }));

// 1. Categories
app.get("/api/categories", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const allCategories = await db.select().from(schema.categories).all();
  return c.json(allCategories);
});

// 2. Products List (with variants & stock calculation)
app.get("/api/products", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const category = c.req.query("category");
  const search = c.req.query("search");

  let productList = await db.select().from(schema.products).where(eq(schema.products.isActive, 1)).all();

  if (category && category !== "all") {
    productList = productList.filter((p) => p.categoryId === category);
  }

  if (search) {
    const s = search.toLowerCase();
    productList = productList.filter((p) => p.name.toLowerCase().includes(s) || p.shortDesc.toLowerCase().includes(s));
  }

  const allVariants = await db.select().from(schema.productVariants).all();

  const productsWithVariants = productList.map((p) => {
    const variants = allVariants.filter((v) => v.productId === p.id);
    const totalStock = variants.reduce((acc, curr) => acc + curr.stock, 0);
    const isOutOfStock = totalStock === 0;
    const isLowStock = totalStock > 0 && totalStock <= 5;

    return {
      ...p,
      variants,
      totalStock,
      isOutOfStock,
      isLowStock,
    };
  });

  return c.json(productsWithVariants);
});

// 3. Product Detail
app.get("/api/products/:slug", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const slug = c.req.param("slug");

  const product = await db.select().from(schema.products).where(eq(schema.products.slug, slug)).get();
  if (!product) {
    return c.json({ error: "Produk tidak ditemukan" }, 404);
  }

  const variants = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, product.id)).all();
  const totalStock = variants.reduce((acc, curr) => acc + curr.stock, 0);

  return c.json({
    ...product,
    variants,
    totalStock,
    isOutOfStock: totalStock === 0,
    isLowStock: totalStock > 0 && totalStock <= 5,
  });
});

// 4. Promotions List (Banners & Vouchers)
app.get("/api/promotions", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const activePromos = await db.select().from(schema.promotions).where(eq(schema.promotions.isActive, 1)).all();
  return c.json(activePromos);
});

// 5. Validate Coupon Code
app.post("/api/promotions/validate", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { code, subtotal } = await c.req.json<{ code: string; subtotal: number }>();

  if (!code) {
    return c.json({ valid: false, message: "Kode promo harus diisi" }, 400);
  }

  const promo = await db
    .select()
    .from(schema.promotions)
    .where(and(eq(schema.promotions.code, code.toUpperCase().trim()), eq(schema.promotions.isActive, 1)))
    .get();

  if (!promo) {
    return c.json({ valid: false, message: "Kode promo tidak ditemukan atau sudah tidak aktif" }, 404);
  }

  if (promo.quota > 0 && promo.usedCount >= promo.quota) {
    return c.json({ valid: false, message: "Kuota penggunaan promo ini telah habis" }, 400);
  }

  if (subtotal < promo.minPurchase) {
    return c.json(
      {
        valid: false,
        message: `Minimal belanja untuk promo ini adalah Rp ${promo.minPurchase.toLocaleString("id-ID")}`,
      },
      400
    );
  }

  let discount = 0;
  if (promo.discountType === "percentage") {
    discount = Math.round((subtotal * promo.discountValue) / 100);
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
  } else {
    discount = promo.discountValue;
  }

  return c.json({
    valid: true,
    promo: {
      id: promo.id,
      code: promo.code,
      title: promo.title,
      discountAmount: discount,
    },
  });
});

// 6. Checkout Order
app.post("/api/orders/checkout", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const body = await c.req.json<{
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    deliveryMethod: string;
    deliveryAddress?: string;
    deliveryDate?: string;
    deliveryTimeSlot?: string;
    greetingCardText?: string;
    promoCode?: string;
    items: {
      productId: string;
      variantId: string;
      quantity: number;
    }[];
  }>();

  if (!body.items || body.items.length === 0) {
    return c.json({ error: "Keranjang belanja masih kosong" }, 400);
  }

  if (!body.customerName || !body.customerPhone) {
    return c.json({ error: "Nama dan nomor WhatsApp wajib diisi" }, 400);
  }

  // Validasi stok untuk setiap item
  const allVariants = await db.select().from(schema.productVariants).all();
  const allProducts = await db.select().from(schema.products).all();

  let subtotal = 0;
  const processedItems = [];

  for (const item of body.items) {
    const variant = allVariants.find((v) => v.id === item.variantId);
    const product = allProducts.find((p) => p.id === item.productId);

    if (!variant || !product) {
      return c.json({ error: "Produk atau varian tidak valid" }, 400);
    }

    if (variant.stock < item.quantity) {
      return c.json(
        {
          error: `Maaf, stok untuk "${product.name} - ${variant.variantName}" hanya tersisa ${variant.stock} box. Silakan sesuaikan jumlah pesanan Anda.`,
          outOfStockItem: {
            productId: product.id,
            variantId: variant.id,
            availableStock: variant.stock,
          },
        },
        400
      );
    }

    const unitPrice = product.basePrice + variant.additionalPrice;
    const itemSubtotal = unitPrice * item.quantity;
    subtotal += itemSubtotal;

    processedItems.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variant.variantName,
      unitPrice,
      quantity: item.quantity,
      subtotal: itemSubtotal,
    });
  }

  // Hitung Diskon
  let discountAmount = 0;
  if (body.promoCode) {
    const promo = await db
      .select()
      .from(schema.promotions)
      .where(and(eq(schema.promotions.code, body.promoCode.toUpperCase().trim()), eq(schema.promotions.isActive, 1)))
      .get();

    if (promo && subtotal >= promo.minPurchase) {
      if (promo.discountType === "percentage") {
        discountAmount = Math.round((subtotal * promo.discountValue) / 100);
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
          discountAmount = promo.maxDiscount;
        }
      } else {
        discountAmount = promo.discountValue;
      }
    }
  }

  // Ongkir
  let shippingFee = 0;
  if (body.deliveryMethod === "instant_courier") {
    shippingFee = 20000;
  } else if (body.deliveryMethod === "sameday") {
    shippingFee = 15000;
  } else {
    shippingFee = 0; // pickup
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderNumber = `DB-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Snap Token Generation (Midtrans / Sandbox Simulation)
  let snapToken = `SNAP-DEMO-${Date.now()}-${orderNumber}`;
  const serverKey = c.env.MIDTRANS_SERVER_KEY;

  if (serverKey && serverKey.startsWith("SB-Mid-server-") && !serverKey.includes("demo")) {
    try {
      const midtransAuth = Buffer.from(`${serverKey}:`).toString("base64");
      const midtransRes = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Basic ${midtransAuth}`,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderNumber,
            gross_amount: totalAmount,
          },
          customer_details: {
            first_name: body.customerName,
            phone: body.customerPhone,
            email: body.customerEmail || "customer@sweetlayers.com",
          },
          item_details: [
            ...processedItems.map((pi) => ({
              id: pi.variantId,
              price: pi.unitPrice,
              quantity: pi.quantity,
              name: `${pi.productName.slice(0, 35)} (${pi.variantName.slice(0, 10)})`,
            })),
            ...(discountAmount > 0
              ? [
                  {
                    id: "DISCOUNT",
                    price: -discountAmount,
                    quantity: 1,
                    name: `Diskon Promo (${body.promoCode})`,
                  },
                ]
              : []),
            ...(shippingFee > 0
              ? [
                  {
                    id: "SHIPPING",
                    price: shippingFee,
                    quantity: 1,
                    name: "Biaya Pengiriman",
                  },
                ]
              : []),
          ],
        }),
      });

      if (midtransRes.ok) {
        const midtransData = (await midtransRes.json()) as { token: string; redirect_url: string };
        snapToken = midtransData.token;
      }
    } catch (err) {
      console.warn("Midtrans live call failed, using fallback snap token:", err);
    }
  }

  // Simpan pesanan ke database D1
  await db.insert(schema.orders).values({
    id: orderId,
    orderNumber,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerEmail: body.customerEmail || "",
    deliveryMethod: body.deliveryMethod,
    deliveryAddress: body.deliveryAddress || "",
    deliveryDate: body.deliveryDate || "",
    deliveryTimeSlot: body.deliveryTimeSlot || "",
    greetingCardText: body.greetingCardText || "",
    subtotal,
    discountAmount,
    shippingFee,
    totalAmount,
    promoCode: body.promoCode || "",
    status: "pending",
    paymentMethod: "midtrans_snap",
    snapToken,
    createdAt: Date.now(),
  });

  // Simpan item pesanan
  for (const item of processedItems) {
    await db.insert(schema.orderItems).values({
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    });
  }

  return c.json({
    success: true,
    orderNumber,
    orderId,
    totalAmount,
    snapToken,
    clientKey: c.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-demo",
  });
});

// 7. Get Order by Order Number
app.get("/api/orders/:orderNumber", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const orderNumber = c.req.param("orderNumber");

  const order = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).get();
  if (!order) {
    return c.json({ error: "Pesanan tidak ditemukan" }, 404);
  }

  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).all();

  return c.json({
    ...order,
    items,
  });
});

// 8. Payment Simulation (Untuk Pengujian Instan / Sandbox Testing)
app.post("/api/payment/simulate", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const { orderNumber, paymentMethod } = await c.req.json<{ orderNumber: string; paymentMethod?: string }>();

  const order = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).get();
  if (!order) {
    return c.json({ error: "Pesanan tidak ditemukan" }, 404);
  }

  if (order.status !== "pending") {
    return c.json({ message: "Status pesanan sudah " + order.status, order });
  }

  // Ambil order items untuk mengurangi stok varian
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).all();

  // Potong stok produk varian secara konsisten
  for (const item of items) {
    const variant = await db.select().from(schema.productVariants).where(eq(schema.productVariants.id, item.variantId)).get();
    if (variant) {
      const newStock = Math.max(0, variant.stock - item.quantity);
      await db.update(schema.productVariants).set({ stock: newStock }).where(eq(schema.productVariants.id, item.variantId));
    }
  }

  // Jika ada promoCode, tambahkan usedCount
  if (order.promoCode) {
    const promo = await db.select().from(schema.promotions).where(eq(schema.promotions.code, order.promoCode)).get();
    if (promo) {
      await db.update(schema.promotions).set({ usedCount: promo.usedCount + 1 }).where(eq(schema.promotions.id, promo.id));
    }
  }

  // Update order status menjadi 'paid'
  await db
    .update(schema.orders)
    .set({
      status: "paid",
      paymentMethod: paymentMethod || "QRIS Instant (Midtrans)",
    })
    .where(eq(schema.orders.id, order.id));

  const updatedOrder = await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)).get();

  return c.json({
    success: true,
    message: "Pembayaran berhasil diverifikasi! Stok produk telah diperbarui.",
    order: updatedOrder,
  });
});

// 9. Midtrans Webhook Handler
app.post("/api/payment/webhook", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const notification = await c.req.json<{
    order_id: string;
    transaction_status: string;
    payment_type?: string;
    fraud_status?: string;
  }>();

  const orderNumber = notification.order_id;
  const status = notification.transaction_status;

  const order = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).get();
  if (!order) {
    return c.json({ message: "Order not found" }, 404);
  }

  if (status === "capture" || status === "settlement") {
    if (order.status === "pending") {
      // Potong stok produk
      const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id)).all();
      for (const item of items) {
        const variant = await db.select().from(schema.productVariants).where(eq(schema.productVariants.id, item.variantId)).get();
        if (variant) {
          await db
            .update(schema.productVariants)
            .set({ stock: Math.max(0, variant.stock - item.quantity) })
            .where(eq(schema.productVariants.id, item.variantId));
        }
      }

      await db
        .update(schema.orders)
        .set({
          status: "paid",
          paymentMethod: notification.payment_type || "midtrans",
        })
        .where(eq(schema.orders.id, order.id));
    }
  } else if (status === "cancel" || status === "expire") {
    await db.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, order.id));
  }

  return c.json({ status: "ok" });
});

// 10. Admin Stats
app.get("/api/admin/stats", async (c) => {
  const db = drizzle(c.env.DB, { schema });

  const allOrders = await db.select().from(schema.orders).all();
  const allVariants = await db.select().from(schema.productVariants).all();

  const totalRevenue = allOrders
    .filter((o) => o.status !== "cancelled" && o.status !== "pending")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const processingOrders = allOrders.filter((o) => o.status === "paid" || o.status === "kitchen_processing").length;
  const completedOrders = allOrders.filter((o) => o.status === "completed").length;

  const lowStockCount = allVariants.filter((v) => v.stock > 0 && v.stock <= 5).length;
  const outOfStockCount = allVariants.filter((v) => v.stock === 0).length;

  return c.json({
    totalRevenue,
    totalOrders: allOrders.length,
    pendingOrders,
    processingOrders,
    completedOrders,
    lowStockCount,
    outOfStockCount,
  });
});

// 11. Admin Orders List
app.get("/api/admin/orders", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const allOrders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).all();
  const allItems = await db.select().from(schema.orderItems).all();

  const ordersWithItems = allOrders.map((ord) => ({
    ...ord,
    items: allItems.filter((it) => it.orderId === ord.id),
  }));

  return c.json(ordersWithItems);
});

// 12. Admin Update Order Status
app.patch("/api/admin/orders/:id/status", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const orderId = c.req.param("id");
  const { status } = await c.req.json<{ status: string }>();

  await db.update(schema.orders).set({ status }).where(eq(schema.orders.id, orderId));
  return c.json({ success: true, status });
});

// 13. Admin Update Variant Stock
app.patch("/api/admin/variants/:id/stock", async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const variantId = c.req.param("id");
  const { stock } = await c.req.json<{ stock: number }>();

  await db.update(schema.productVariants).set({ stock: Math.max(0, stock) }).where(eq(schema.productVariants.id, variantId));
  return c.json({ success: true, variantId, newStock: stock });
});

export default app;
