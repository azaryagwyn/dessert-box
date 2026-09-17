import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "./db/schema";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_VARIANTS,
  DEFAULT_PROMOTIONS,
} from "./db/initial-data";

type Bindings = {
  DB?: D1Database;
  MIDTRANS_SERVER_KEY?: string;
  MIDTRANS_CLIENT_KEY?: string;
  MIDTRANS_IS_PRODUCTION?: string;
};

// In-memory fallback state if D1 is not yet bound on Cloudflare Pages
let memoryOrders: any[] = [];
let memoryVariants = [...DEFAULT_VARIANTS];
let memoryPromotions = [...DEFAULT_PROMOTIONS];

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

// Error handler agar respon selalu berupa JSON yang valid (tidak pernah 'Internal Server Error' plain text)
app.onError((err, c) => {
  console.error("API Unhandled Error:", err);
  return c.json(
    {
      error: err.message || "Terjadi kesalahan pada server",
      code: "INTERNAL_ERROR",
    },
    500
  );
});

// Health check
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: Date.now(),
    d1_connected: Boolean(c.env?.DB),
  })
);

// 1. Categories
app.get("/api/categories", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const cats = await db.select().from(schema.categories).all();
      if (cats && cats.length > 0) return c.json(cats);
    } catch (e) {
      console.warn("D1 categories query failed, using fallback:", e);
    }
  }
  return c.json(DEFAULT_CATEGORIES);
});

// 2. Products List (with variants & live stock)
app.get("/api/products", async (c) => {
  const category = c.req.query("category");
  const search = c.req.query("search");

  let productList: any[] = DEFAULT_PRODUCTS;
  let allVariants: any[] = memoryVariants;

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const prodsFromDb = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.isActive, 1))
        .all();
      const varsFromDb = await db.select().from(schema.productVariants).all();

      if (prodsFromDb && prodsFromDb.length > 0) {
        productList = prodsFromDb;
      }
      if (varsFromDb && varsFromDb.length > 0) {
        allVariants = varsFromDb;
      }
    } catch (e) {
      console.warn("D1 products query failed, using fallback:", e);
    }
  }

  if (category && category !== "all") {
    productList = productList.filter((p) => p.categoryId === category);
  }

  if (search) {
    const s = search.toLowerCase();
    productList = productList.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.shortDesc && p.shortDesc.toLowerCase().includes(s))
    );
  }

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
  const slug = c.req.param("slug");
  let product: any = DEFAULT_PRODUCTS.find((p) => p.slug === slug);
  let allVariants: any[] = memoryVariants;

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const pDb = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.slug, slug))
        .get();
      if (pDb) product = pDb;
      const varsFromDb = await db.select().from(schema.productVariants).all();
      if (varsFromDb && varsFromDb.length > 0) allVariants = varsFromDb;
    } catch (e) {
      console.warn("D1 product detail error, fallback:", e);
    }
  }

  if (!product) {
    return c.json({ error: "Produk tidak ditemukan" }, 404);
  }

  const variants = allVariants.filter((v) => v.productId === product.id);
  const totalStock = variants.reduce((acc, curr) => acc + curr.stock, 0);

  return c.json({
    ...product,
    variants,
    totalStock,
    isOutOfStock: totalStock === 0,
    isLowStock: totalStock > 0 && totalStock <= 5,
  });
});

// 4. Promotions List
app.get("/api/promotions", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const promos = await db
        .select()
        .from(schema.promotions)
        .where(eq(schema.promotions.isActive, 1))
        .all();
      if (promos && promos.length > 0) return c.json(promos);
    } catch (e) {
      console.warn("D1 promotions error, fallback:", e);
    }
  }
  return c.json(memoryPromotions);
});

// 5. Validate Coupon Code
app.post("/api/promotions/validate", async (c) => {
  const { code, subtotal } = await c.req.json<{ code: string; subtotal: number }>();

  if (!code) {
    return c.json({ valid: false, message: "Kode promo harus diisi" }, 400);
  }

  const cleanCode = code.toUpperCase().trim();
  let promo: any = null;

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      promo = await db
        .select()
        .from(schema.promotions)
        .where(
          and(
            eq(schema.promotions.code, cleanCode),
            eq(schema.promotions.isActive, 1)
          )
        )
        .get();
    } catch (e) {
      console.warn("D1 promo validate error:", e);
    }
  }

  if (!promo) {
    promo = memoryPromotions.find((p) => p.code === cleanCode && p.isActive === 1);
  }

  if (!promo) {
    return c.json(
      { valid: false, message: "Kode promo tidak ditemukan atau sudah tidak aktif" },
      404
    );
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

  let allProducts: any[] = DEFAULT_PRODUCTS;
  let allVariants: any[] = memoryVariants;
  let db: any = null;

  if (c.env?.DB) {
    try {
      db = drizzle(c.env.DB, { schema });
      const pDb = await db.select().from(schema.products).all();
      const vDb = await db.select().from(schema.productVariants).all();
      if (pDb && pDb.length > 0) allProducts = pDb;
      if (vDb && vDb.length > 0) allVariants = vDb;
    } catch (e) {
      console.warn("D1 checkout read error, using fallback catalog:", e);
    }
  }

  let subtotal = 0;
  const processedItems: any[] = [];

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

  // Diskon Promo
  let discountAmount = 0;
  if (body.promoCode) {
    const cleanPromo = body.promoCode.toUpperCase().trim();
    let promo = memoryPromotions.find((p) => p.code === cleanPromo);
    if (db) {
      try {
        const pDb = await db
          .select()
          .from(schema.promotions)
          .where(
            and(
              eq(schema.promotions.code, cleanPromo),
              eq(schema.promotions.isActive, 1)
            )
          )
          .get();
        if (pDb) promo = pDb;
      } catch (e) {}
    }

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
    shippingFee = 0;
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderNumber = `DB-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Midtrans Snap Token
  let snapToken = `SNAP-DEMO-${Date.now()}-${orderNumber}`;
  const serverKey = c.env?.MIDTRANS_SERVER_KEY;
  const isProduction = c.env?.MIDTRANS_IS_PRODUCTION === "true";

  if (serverKey && !serverKey.includes("demo")) {
    try {
      const midtransAuth = Buffer.from(`${serverKey}:`).toString("base64");
      const midtransEndpoint = isProduction
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

      const midtransRes = await fetch(midtransEndpoint, {
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
        const midtransData = (await midtransRes.json()) as { token: string };
        if (midtransData.token) {
          snapToken = midtransData.token;
        }
      } else {
        const errText = await midtransRes.text();
        console.warn("Midtrans responded non-200:", errText);
      }
    } catch (err) {
      console.warn("Midtrans request error:", err);
    }
  }

  // Simpan pesanan
  const orderRecord = {
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
    items: processedItems,
  };

  memoryOrders.unshift(orderRecord);

  if (db) {
    try {
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

      for (const it of processedItems) {
        await db.insert(schema.orderItems).values({
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          orderId,
          productId: it.productId,
          variantId: it.variantId,
          productName: it.productName,
          variantName: it.variantName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          subtotal: it.subtotal,
        });
      }
    } catch (e) {
      console.warn("D1 insert order error:", e);
    }
  }

  return c.json({
    success: true,
    orderNumber,
    orderId,
    totalAmount,
    snapToken,
    clientKey: c.env?.MIDTRANS_CLIENT_KEY || "Mid-client-2EeEfmUgvLiI7DKV",
  });
});

// 7. Get Order by Order Number
app.get("/api/orders/:orderNumber", async (c) => {
  const orderNumber = c.req.param("orderNumber");
  let order = memoryOrders.find((o) => o.orderNumber === orderNumber);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oDb = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.orderNumber, orderNumber))
        .get();
      if (oDb) {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, oDb.id))
          .all();
        order = { ...oDb, items };
      }
    } catch (e) {}
  }

  if (!order) {
    return c.json({ error: "Pesanan tidak ditemukan" }, 404);
  }

  return c.json(order);
});

// 8. Payment Simulation (Sandbox Testing / Verifikasi Instan)
app.post("/api/payment/simulate", async (c) => {
  const { orderNumber, paymentMethod } = await c.req.json<{
    orderNumber: string;
    paymentMethod?: string;
  }>();

  let order = memoryOrders.find((o) => o.orderNumber === orderNumber);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oDb = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.orderNumber, orderNumber))
        .get();

      if (oDb) {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, oDb.id))
          .all();

        for (const it of items) {
          const v = await db
            .select()
            .from(schema.productVariants)
            .where(eq(schema.productVariants.id, it.variantId))
            .get();
          if (v) {
            await db
              .update(schema.productVariants)
              .set({ stock: Math.max(0, v.stock - it.quantity) })
              .where(eq(schema.productVariants.id, it.variantId));
          }
        }

        await db
          .update(schema.orders)
          .set({ status: "paid", paymentMethod: paymentMethod || "QRIS Instant" })
          .where(eq(schema.orders.id, oDb.id));

        const updated = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.id, oDb.id))
          .get();
        return c.json({ success: true, order: { ...updated, items } });
      }
    } catch (e) {
      console.warn("D1 simulate payment error:", e);
    }
  }

  if (!order) {
    return c.json({ error: "Pesanan tidak ditemukan" }, 404);
  }

  // Update in-memory stock & status
  if (order.items) {
    for (const it of order.items) {
      const idx = memoryVariants.findIndex((v) => v.id === it.variantId);
      if (idx > -1) {
        memoryVariants[idx].stock = Math.max(0, memoryVariants[idx].stock - it.quantity);
      }
    }
  }

  order.status = "paid";
  order.paymentMethod = paymentMethod || "QRIS Instant";

  return c.json({
    success: true,
    message: "Pembayaran berhasil diverifikasi!",
    order,
  });
});

// 9. Webhook Midtrans
app.post("/api/payment/webhook", async (c) => {
  const notification = await c.req.json<{
    order_id: string;
    transaction_status: string;
    payment_type?: string;
  }>();

  const orderNumber = notification.order_id;
  const status = notification.transaction_status;

  if (status === "capture" || status === "settlement") {
    // tandai paid
    const ord = memoryOrders.find((o) => o.orderNumber === orderNumber);
    if (ord) {
      ord.status = "paid";
      ord.paymentMethod = notification.payment_type || "midtrans";
    }

    if (c.env?.DB) {
      try {
        const db = drizzle(c.env.DB, { schema });
        const oDb = await db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.orderNumber, orderNumber))
          .get();
        if (oDb) {
          await db
            .update(schema.orders)
            .set({ status: "paid", paymentMethod: notification.payment_type || "midtrans" })
            .where(eq(schema.orders.id, oDb.id));
        }
      } catch (e) {}
    }
  }

  return c.json({ status: "ok" });
});

// 10. Admin Stats
app.get("/api/admin/stats", async (c) => {
  const totalRevenue = memoryOrders
    .filter((o) => o.status !== "pending" && o.status !== "cancelled")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return c.json({
    totalRevenue,
    totalOrders: memoryOrders.length,
    pendingOrders: memoryOrders.filter((o) => o.status === "pending").length,
    processingOrders: memoryOrders.filter((o) => o.status === "paid").length,
    completedOrders: memoryOrders.filter((o) => o.status === "completed").length,
    lowStockCount: memoryVariants.filter((v) => v.stock > 0 && v.stock <= 5).length,
    outOfStockCount: memoryVariants.filter((v) => v.stock === 0).length,
  });
});

// 11. Admin Orders
app.get("/api/admin/orders", async (c) => {
  return c.json(memoryOrders);
});

// 12. Admin Variant Stock
app.patch("/api/admin/variants/:id/stock", async (c) => {
  const variantId = c.req.param("id");
  const { stock } = await c.req.json<{ stock: number }>();

  const idx = memoryVariants.findIndex((v) => v.id === variantId);
  if (idx > -1) {
    memoryVariants[idx].stock = Math.max(0, stock);
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db
        .update(schema.productVariants)
        .set({ stock: Math.max(0, stock) })
        .where(eq(schema.productVariants.id, variantId));
    } catch (e) {}
  }

  return c.json({ success: true, variantId, newStock: stock });
});

export default app;
