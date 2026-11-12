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
  DEFAULT_USERS,
} from "./db/initial-data";
import { buildGeneratedDummyDataset, DUMMY_CUSTOMERS_SPEC } from "./dummy-crm-data";
import {
  hashPassword,
  verifyPassword,
  createAuthToken,
  verifyAuthToken,
  extractBearerToken,
} from "./auth/crypto";

type Bindings = {
  DB?: D1Database;
  MIDTRANS_SERVER_KEY?: string;
  MIDTRANS_CLIENT_KEY?: string;
  MIDTRANS_IS_PRODUCTION?: string;
  JWT_SECRET?: string;
};

// In-memory fallback state if D1 is not yet bound on Cloudflare Pages
let memoryUsers = [...DEFAULT_USERS];
let memoryProducts = [...DEFAULT_PRODUCTS];
let memoryOrders: any[] = [];
let memoryVariants = [...DEFAULT_VARIANTS];
let memoryPromotions = [...DEFAULT_PROMOTIONS];
let memoryStockLogs: any[] = [
  {
    id: "log_init_1",
    variantId: "v1_1",
    productId: "p1",
    productName: "Belgian Dark Choco Melt Box",
    variantName: "Personal Box (350ml)",
    changeType: "restock",
    quantityDelta: 15,
    previousStock: 0,
    newStock: 15,
    referenceId: "BATCH-2026-001",
    notes: "Stok awal produksi harian dapur SweetLayers",
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "log_init_2",
    variantId: "v2_1",
    productId: "p2",
    productName: "Classic Venetian Tiramisu Box",
    variantName: "Personal Box (350ml)",
    changeType: "restock",
    quantityDelta: 12,
    previousStock: 0,
    newStock: 12,
    referenceId: "BATCH-2026-001",
    notes: "Stok awal produksi harian dapur SweetLayers",
    createdAt: Date.now() - 86400000 * 2,
  },
];
let memoryPromotionUsages: any[] = [];
let memoryRetentionActions: any[] = [];

async function getAuthenticatedUser(c: any) {
  const token = extractBearerToken(c.req.header("Authorization"));
  if (!token) return null;
  return await verifyAuthToken(token);
}

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors());

let schemaMigrationDone = false;

async function ensureDatabaseSchema(d1: D1Database) {
  if (schemaMigrationDone) return;
  try {
    // 1. users table
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        created_at INTEGER NOT NULL
      );
    `).run();

    // 2. ensure columns in orders table
    const orderCols = await d1.prepare("PRAGMA table_info(orders)").all();
    const existingOrderCols = new Set((orderCols.results as any[]).map((col: any) => col.name));

    if (!existingOrderCols.has("customer_id")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN customer_id TEXT;").run();
    }
    if (!existingOrderCols.has("delivery_method")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'instant_courier';").run();
    }
    if (!existingOrderCols.has("delivery_address")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN delivery_address TEXT;").run();
    }
    if (!existingOrderCols.has("delivery_date")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN delivery_date TEXT;").run();
    }
    if (!existingOrderCols.has("delivery_time_slot")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN delivery_time_slot TEXT;").run();
    }
    if (!existingOrderCols.has("greeting_card_text")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN greeting_card_text TEXT;").run();
    }
    if (!existingOrderCols.has("promo_code")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN promo_code TEXT;").run();
    }
    if (!existingOrderCols.has("snap_token")) {
      await d1.prepare("ALTER TABLE orders ADD COLUMN snap_token TEXT;").run();
    }

    // 3. ensure columns in promotions table
    const promoCols = await d1.prepare("PRAGMA table_info(promotions)").all();
    const existingPromoCols = new Set((promoCols.results as any[]).map((col: any) => col.name));

    if (!existingPromoCols.has("valid_from")) {
      await d1.prepare("ALTER TABLE promotions ADD COLUMN valid_from INTEGER;").run();
    }
    if (!existingPromoCols.has("valid_until")) {
      await d1.prepare("ALTER TABLE promotions ADD COLUMN valid_until INTEGER;").run();
    }
    if (!existingPromoCols.has("max_usage_per_user")) {
      await d1.prepare("ALTER TABLE promotions ADD COLUMN max_usage_per_user INTEGER NOT NULL DEFAULT 1;").run();
    }
    if (!existingPromoCols.has("target_segment")) {
      await d1.prepare("ALTER TABLE promotions ADD COLUMN target_segment TEXT DEFAULT 'all';").run();
    }
    if (!existingPromoCols.has("target_customer_email")) {
      await d1.prepare("ALTER TABLE promotions ADD COLUMN target_customer_email TEXT;").run();
    }

    // 4. stock_logs table
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS stock_logs (
        id TEXT PRIMARY KEY,
        variant_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        variant_name TEXT NOT NULL,
        change_type TEXT NOT NULL,
        quantity_delta INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        reference_id TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL
      );
    `).run();

    // 5. promotion_usages table
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS promotion_usages (
        id TEXT PRIMARY KEY,
        promotion_id TEXT NOT NULL,
        order_id TEXT NOT NULL,
        order_number TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        discount_amount INTEGER NOT NULL,
        used_at INTEGER NOT NULL
      );
    `).run();

    // 6. customer_retention_actions table
    await d1.prepare(`
      CREATE TABLE IF NOT EXISTS customer_retention_actions (
        id TEXT PRIMARY KEY,
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        action_type TEXT NOT NULL,
        promo_code TEXT NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'sent',
        created_at INTEGER NOT NULL
      );
    `).run();

    // 7. Seed default admin if missing
    await d1.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, created_at) VALUES
      ('usr_admin_1', 'Admin SweetLayers', 'admin@sweetlayers.com', '081234567890', '02f34e4e6b5351afc6ab1163a31aca891937556501c12323ff77d72dbe537543', 'admin', 1726500000000);
    `).run();

    schemaMigrationDone = true;
  } catch (err) {
    console.warn("Schema migration warning:", err);
  }
}

app.use("*", async (c, next) => {
  if (c.env?.DB) {
    await ensureDatabaseSchema(c.env.DB);
  }
  await next();
});

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
    version: "2.2-resilient",
    timestamp: Date.now(),
    d1_connected: Boolean(c.env?.DB),
  })
);

// SEO & GEO Crawlers: robots.txt
app.get("/robots.txt", (c) => {
  const robots = `# SweetLayers Dessert Box Robots.txt
# Optimized for Google, Bing, and AI Search Crawlers (GEO)
User-agent: *
Allow: /
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /admin

User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot
Allow: /

Sitemap: https://ecommerce.sweetlayers.my.id/sitemap.xml
`;
  return c.text(robots, 200, {
    "Content-Type": "text/plain; charset=UTF-8",
    "Cache-Control": "public, max-age=86400",
  });
});

// SEO & GEO Crawlers: sitemap.xml
app.get("/sitemap.xml", (c) => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://ecommerce.sweetlayers.my.id/</loc>
    <lastmod>2026-10-29</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/grand-festive-hamper.jpg</image:loc>
      <image:title>SweetLayers Grand Festive Hamper 4 Box</image:title>
      <image:caption>Paket hampers eksklusif dessert box premium SweetLayers Jakarta</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/belgian-dark-choco.jpg</image:loc>
      <image:title>Belgian Dark Choco Melt Box</image:title>
      <image:caption>Dessert box sponge cake cokelat lembut dengan mousse Belgian dark chocolate</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/classic-venetian-tiramisu.jpg</image:loc>
      <image:title>Classic Venetian Tiramisu Box</image:title>
      <image:caption>Tiramisu otentik dengan espresso single-origin dan krim mascarpone lembut</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/lotus-biscoff-caramel-velvet.jpg</image:loc>
      <image:title>Lotus Biscoff Caramel Velvet Box</image:title>
      <image:caption>Dessert box perpaduan biskuit Lotus Biscoff dan saus karamel leleh</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/matcha-basque-cream-cheese.jpg</image:loc>
      <image:title>Matcha Basque Cream Cheese Box</image:title>
      <image:caption>Dessert box Uji Matcha premium Jepang berpadu keju basque panggang lembut</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/fresh-strawberry-shortcake.jpg</image:loc>
      <image:title>Fresh Strawberry Shortcake Box</image:title>
      <image:caption>Vanilla sponge dengan fresh chantilly cream dan stroberi segar</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/mango-coconut-sago.jpg</image:loc>
      <image:title>Mango Coconut Sago Jar</image:title>
      <image:caption>Dessert jar puree mangga harum manis dengan sagu mutiara dan santan creamy</image:caption>
    </image:image>
    <image:image>
      <image:loc>https://ecommerce.sweetlayers.my.id/images/products/red-velvet-dream-cheese.jpg</image:loc>
      <image:title>Red Velvet Dream Cheese Box</image:title>
      <image:caption>Kue Red Velvet lembab dengan frosting cream cheese segar</image:caption>
    </image:image>
  </url>
</urlset>`;
  return c.body(sitemap, 200, {
    "Content-Type": "application/xml; charset=UTF-8",
    "Cache-Control": "public, max-age=86400",
  });
});


app.get("/api/test-midtrans", async (c) => {
  const serverKey =
    c.env?.MIDTRANS_SERVER_KEY || atob("TWlkLXNlcnZlci1lSl9WNEMxZE5JeHhyMkhQNmZ0cmgyV3Q=");
  const auth = btoa(`${serverKey}:`);
  try {
    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: "DIAG-" + Date.now(),
          gross_amount: 10000,
        },
      }),
    });
    const status = res.status;
    const text = await res.text();
    return c.json({ status, text, auth_prefix: auth.slice(0, 10) });
  } catch (err: any) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});

// Diagnostic D1 Database Route
app.get("/api/test-d1", async (c) => {
  if (!c.env?.DB) {
    return c.json({ error: "c.env.DB is missing!" }, 500);
  }
  try {
    const db = drizzle(c.env.DB, { schema });
    
    // Explicitly run migration here to see if it succeeds or why it fails
    let migrationReport: any = {};
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer',
          created_at INTEGER NOT NULL
        );
      `).run();
      migrationReport.usersTable = "created_or_exists";
    } catch (e: any) {
      migrationReport.usersTableError = e.message;
    }

    try {
      await c.env.DB.prepare("ALTER TABLE orders ADD COLUMN customer_id TEXT;").run();
      migrationReport.addCustomerId = "success";
    } catch (e: any) {
      migrationReport.addCustomerId = e.message;
    }

    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS stock_logs (
          id TEXT PRIMARY KEY,
          variant_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          variant_name TEXT NOT NULL,
          change_type TEXT NOT NULL,
          quantity_delta INTEGER NOT NULL,
          previous_stock INTEGER NOT NULL,
          new_stock INTEGER NOT NULL,
          reference_id TEXT,
          notes TEXT,
          created_at INTEGER NOT NULL
        );
      `).run();
      migrationReport.stockLogsTable = "created_or_exists";
    } catch (e: any) {
      migrationReport.stockLogsError = e.message;
    }

    const rawTables = await c.env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const orderPragma = await c.env.DB.prepare("PRAGMA table_info(orders)").all();
    const ordersCount = await c.env.DB.prepare("SELECT count(*) as count FROM orders").all();
    const latestOrders = await c.env.DB.prepare("SELECT id, order_number, customer_name, status, created_at FROM orders ORDER BY created_at DESC LIMIT 5").all();
    
    let insertTestResult: any = "not_tested";
    const testOrderId = `test_${Date.now()}`;
    const testOrderNum = `TEST-${Date.now()}`;
    try {
      await db.insert(schema.orders).values({
        id: testOrderId,
        orderNumber: testOrderNum,
        customerId: null,
        customerName: "D1 Diagnostics",
        customerPhone: "08123456789",
        customerEmail: "diagnostics@sweetlayers.com",
        deliveryMethod: "instant_courier",
        deliveryAddress: "Jakarta",
        subtotal: 50000,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount: 50000,
        status: "pending",
        createdAt: Date.now(),
      });
      insertTestResult = "success";
      await c.env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(testOrderId).run();
    } catch (insErr: any) {
      insertTestResult = { error: insErr.message, stack: insErr.stack };
    }

    return c.json({
      hasDB: true,
      migrationReport,
      orderColumns: orderPragma.results,
      tables: rawTables.results,
      ordersCount: ordersCount.results,
      latestOrders: latestOrders.results,
      insertTestResult,
    });
  } catch (err: any) {
    return c.json({ error: err.message, stack: err.stack }, 500);
  }
});

// ==========================================
// AUTHENTICATION & CUSTOMER ACCOUNT
// ==========================================

// Register Customer
app.post("/api/auth/register", async (c) => {
  const { name, email, phone, password } = await c.req.json<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>();

  if (!name || !email || !password) {
    return c.json({ error: "Nama, email / ID pengguna, dan kata sandi wajib diisi" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "Kata sandi minimal 6 karakter" }, 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  // Cek duplikasi email / username
  let existingUser = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const uDb = await db.select().from(schema.users).where(eq(schema.users.email, cleanEmail)).get();
      if (uDb) existingUser = uDb;
    } catch (e) {}
  }

  if (existingUser) {
    return c.json({ error: "Email / ID pengguna sudah terdaftar. Silakan gunakan menu Masuk / Login." }, 400);
  }

  const passwordHash = await hashPassword(password);
  const userId = `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser = {
    id: userId,
    name: name.trim(),
    email: cleanEmail,
    phone: (phone || "").trim(),
    passwordHash,
    role: "customer" as const,
    createdAt: Date.now(),
  };

  memoryUsers.push(newUser);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.insert(schema.users).values({
        id: userId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        passwordHash: newUser.passwordHash,
        role: newUser.role,
        createdAt: newUser.createdAt,
      });
    } catch (e) {
      console.warn("D1 insert user failed:", e);
    }
  }

  const token = await createAuthToken({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  });

  return c.json({
    success: true,
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    },
  });
});

// Login (Customer & Admin)
app.post("/api/auth/login", async (c) => {
  const { email, password, syncProfile } = await c.req.json<{
    email?: string;
    password?: string;
    syncProfile?: { name: string; phone?: string };
  }>();

  if (!email || !password) {
    return c.json({ error: "Email / ID pengguna dan kata sandi wajib diisi" }, 400);
  }

  const cleanEmail = email.toLowerCase().trim();

  let user = memoryUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const uDb = await db.select().from(schema.users).where(eq(schema.users.email, cleanEmail)).get();
      if (uDb) user = uDb;
    } catch (e) {}
  }

  if (!user && syncProfile && syncProfile.name) {
    const passwordHash = await hashPassword(password);
    const userId = `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    user = {
      id: userId,
      name: syncProfile.name.trim(),
      email: cleanEmail,
      phone: (syncProfile.phone || "").trim(),
      passwordHash,
      role: "customer" as const,
      createdAt: Date.now(),
    };
    memoryUsers.push(user);
    if (c.env?.DB) {
      try {
        const db = drizzle(c.env.DB, { schema });
        await db.insert(schema.users).values(user);
      } catch (_) {}
    }
  }

  if (!user) {
    return c.json({ error: "Email / ID pengguna atau kata sandi tidak cocok" }, 401);
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    return c.json({ error: "Email / ID pengguna atau kata sandi tidak cocok" }, 401);
  }

  const token = await createAuthToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "admin" | "customer",
  });

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// Profile / Current User
app.get("/api/auth/me", async (c) => {
  const auth = await getAuthenticatedUser(c);
  if (!auth) {
    return c.json({ error: "Sesi telah berakhir atau belum login" }, 401);
  }

  let user = memoryUsers.find((u) => u.id === auth.userId);
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const uDb = await db.select().from(schema.users).where(eq(schema.users.id, auth.userId)).get();
      if (uDb) user = uDb;
    } catch (e) {}
  }

  return c.json({
    user: {
      id: auth.userId,
      name: user?.name || auth.name,
      email: user?.email || auth.email,
      phone: user?.phone || "",
      role: user?.role || auth.role,
    },
  });
});

// Customer Orders History
app.get("/api/customer/orders", async (c) => {
  const auth = await getAuthenticatedUser(c);
  if (!auth) {
    return c.json({ error: "Silakan login terlebih dahulu" }, 401);
  }

  let orders: any[] = [];
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oList = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customerEmail, auth.email))
        .orderBy(desc(schema.orders.createdAt))
        .all();

      for (const o of oList) {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, o.id))
          .all();
        orders.push({ ...o, items });
      }
    } catch (e) {
      console.warn("D1 get customer orders failed:", e);
    }
  }

  if (orders.length === 0) {
    orders = memoryOrders.filter(
      (o) =>
        (o.customerId && o.customerId === auth.userId) ||
        (o.customerEmail && o.customerEmail.toLowerCase() === auth.email.toLowerCase())
    );
  }

  return c.json(orders);
});

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

  let productList: any[] = memoryProducts;
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
        productList = prodsFromDb.map((p) => {
          const defaultMatch = DEFAULT_PRODUCTS.find((dp) => dp.id === p.id);
          if (
            defaultMatch &&
            p.imageUrl &&
            p.imageUrl.includes("images.unsplash.com") &&
            !defaultMatch.imageUrl.includes("images.unsplash.com")
          ) {
            // Persist the update to Cloudflare D1 database directly
            db.update(schema.products)
              .set({ imageUrl: defaultMatch.imageUrl })
              .where(eq(schema.products.id, p.id))
              .execute()
              .catch(() => {});
            return { ...p, imageUrl: defaultMatch.imageUrl };
          }
          return p;
        });
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
      if (pDb) {
        product = pDb;
        const defaultMatch = DEFAULT_PRODUCTS.find((dp) => dp.id === pDb.id);
        if (
          defaultMatch &&
          product.imageUrl &&
          product.imageUrl.includes("images.unsplash.com") &&
          !defaultMatch.imageUrl.includes("images.unsplash.com")
        ) {
          product.imageUrl = defaultMatch.imageUrl;
        }
      }
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
      if (promos && promos.length > 0) {
        // Hanya tampilkan promo yang aktif dan kuota belum habis
        const availablePromos = promos.filter(
          (p) => !p.quota || p.quota === 0 || p.usedCount < p.quota
        );
        return c.json(availablePromos);
      }
    } catch (e) {
      console.warn("D1 promotions error, fallback:", e);
    }
  }
  const availableMem = memoryPromotions.filter(
    (p) => p.isActive === 1 && (!p.quota || p.quota === 0 || p.usedCount < p.quota)
  );
  return c.json(availableMem);
});

// Helper: Evaluate dynamic customer segment for targeted promotions
async function evaluateCustomerSegment(
  c: any,
  customerEmail?: string
): Promise<"new" | "repeat" | "loyal" | "inactive"> {
  if (!customerEmail) return "new";
  const cleanEmail = customerEmail.toLowerCase().trim();

  let validOrders: any[] = [];
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oDb = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customerEmail, cleanEmail))
        .all();
      validOrders = oDb.filter(
        (o) =>
          o.status === "paid" ||
          o.status === "kitchen_processing" ||
          o.status === "out_for_delivery" ||
          o.status === "completed"
      );
    } catch (_) {}
  }

  if (validOrders.length === 0) {
    validOrders = memoryOrders.filter(
      (o) =>
        o.customerEmail &&
        o.customerEmail.toLowerCase().trim() === cleanEmail &&
        (o.status === "paid" ||
          o.status === "kitchen_processing" ||
          o.status === "out_for_delivery" ||
          o.status === "completed")
    );
  }

  const totalOrders = validOrders.length;
  const totalSpent = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const orderDates = validOrders.map((o) => o.createdAt || 0);
  const lastOrderDate = orderDates.length > 0 ? Math.max(...orderDates) : null;
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (totalOrders >= 5 || totalSpent >= 500000) {
    return "loyal";
  } else if (totalOrders >= 2) {
    if (lastOrderDate && now - lastOrderDate > thirtyDaysMs) {
      return "inactive";
    }
    return "repeat";
  } else if (totalOrders === 1) {
    if (lastOrderDate && now - lastOrderDate > 45 * 24 * 60 * 60 * 1000) {
      return "inactive";
    }
    return "new";
  }

  return "new";
}

// 5. Validate Coupon Code
app.post("/api/promotions/validate", async (c) => {
  const { code, subtotal, customerEmail } = await c.req.json<{
    code: string;
    subtotal: number;
    customerEmail?: string;
  }>();

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

  // Validity Period Check (Start & Expiry Date)
  const now = Date.now();
  if (promo.validFrom && now < promo.validFrom) {
    return c.json({ valid: false, message: "Periode penggunaan promo ini belum dimulai" }, 400);
  }
  if (promo.validUntil && now > promo.validUntil) {
    return c.json({ valid: false, message: "Masa berlaku promo ini telah berakhir (expired)" }, 400);
  }

  // Global Quota Check
  if (promo.quota > 0 && promo.usedCount >= promo.quota) {
    return c.json({ valid: false, message: "Kuota penggunaan promo ini telah habis" }, 400);
  }

  // Target Segment & Specific Customer Email Check
  const targetSegment = promo.targetSegment || "all";
  if (targetSegment !== "all") {
    if (!customerEmail) {
      return c.json(
        {
          valid: false,
          message: `Promo ini khusus untuk segmen pelanggan tertentu (${targetSegment.toUpperCase()}). Silakan isi email pemesan atau login terlebih dahulu.`,
        },
        400
      );
    }

    const cleanEmail = customerEmail.toLowerCase().trim();

    if (targetSegment === "specific_email") {
      const allowedEmail = (promo.targetCustomerEmail || "").toLowerCase().trim();
      if (!allowedEmail || cleanEmail !== allowedEmail) {
        return c.json(
          {
            valid: false,
            message: `Kupon promo ini khusus diperuntukkan bagi customer dengan email: ${promo.targetCustomerEmail || "tertentu"}.`,
          },
          400
        );
      }
    } else {
      const currentSegment = await evaluateCustomerSegment(c, cleanEmail);
      if (targetSegment === "new" && currentSegment !== "new") {
        return c.json(
          {
            valid: false,
            message: "Promo ini khusus untuk 'New Customer' (pelanggan baru pada pesanan pertama).",
          },
          400
        );
      } else if (targetSegment === "loyal" && currentSegment !== "loyal") {
        return c.json(
          {
            valid: false,
            message: "Promo ini merupakan apresiasi khusus bagi 'Loyal Customer' (min. 5x transaksi atau belanja Rp 500rb).",
          },
          400
        );
      } else if (targetSegment === "repeat" && currentSegment !== "repeat" && currentSegment !== "loyal") {
        return c.json(
          {
            valid: false,
            message: "Promo ini khusus untuk 'Repeat Customer' yang telah pernah berbelanja di SweetLayers.",
          },
          400
        );
      } else if (targetSegment === "inactive" && currentSegment !== "inactive") {
        return c.json(
          {
            valid: false,
            message: "Promo ini adalah voucher 'Kami Rindu Kamu' khusus pelanggan yang lama tidak bertransaksi.",
          },
          400
        );
      }
    }
  }

  // Per-Customer Usage Limit Check
  if (customerEmail && (promo.maxUsagePerUser || 1)) {
    const limit = promo.maxUsagePerUser || 1;
    const cleanEmail = customerEmail.toLowerCase().trim();
    let userUsedCount = 0;

    if (c.env?.DB) {
      try {
        const db = drizzle(c.env.DB, { schema });
        const usages = await db
          .select()
          .from(schema.promotionUsages)
          .where(
            and(
              eq(schema.promotionUsages.promotionId, promo.id),
              eq(schema.promotionUsages.customerEmail, cleanEmail)
            )
          )
          .all();
        userUsedCount = usages.length;
      } catch (e) {}
    }

    if (userUsedCount === 0) {
      userUsedCount = memoryPromotionUsages.filter(
        (u) =>
          u.promotionId === promo.id &&
          u.customerEmail &&
          u.customerEmail.toLowerCase() === cleanEmail
      ).length;
    }

    if (userUsedCount >= limit) {
      return c.json(
        {
          valid: false,
          message: `Anda sudah mencapai batas penggunaan (${limit}x) untuk promo ini`,
        },
        400
      );
    }
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
      targetSegment: promo.targetSegment || "all",
      targetCustomerEmail: promo.targetCustomerEmail || null,
    },
  });
});

// 6. Checkout Order
app.post("/api/orders/checkout", async (c) => {
  const body = await c.req.json<{
    customerId?: string;
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

  const authUser = await getAuthenticatedUser(c);
  const customerId = authUser?.userId || body.customerId || null;

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
    let promo = memoryPromotions.find((p) => p.code === cleanPromo && p.isActive === 1);
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

    const now = Date.now();
    const isValidDate = (!promo?.validFrom || now >= promo.validFrom) && (!promo?.validUntil || now <= promo.validUntil);
    const hasQuota = !promo?.quota || promo.usedCount < promo.quota;

    if (promo && isValidDate && hasQuota && subtotal >= promo.minPurchase) {
      let isEligible = true;
      const targetSegment = promo.targetSegment || "all";
      if (targetSegment !== "all") {
        const cleanEmail = (body.customerEmail || "").toLowerCase().trim();
        if (!cleanEmail) {
          isEligible = false;
        } else if (targetSegment === "specific_email") {
          isEligible = cleanEmail === (promo.targetCustomerEmail || "").toLowerCase().trim();
        } else {
          const currentSegment = await evaluateCustomerSegment(c, cleanEmail);
          if (targetSegment === "new") isEligible = currentSegment === "new";
          else if (targetSegment === "loyal") isEligible = currentSegment === "loyal";
          else if (targetSegment === "repeat") isEligible = currentSegment === "repeat" || currentSegment === "loyal";
          else if (targetSegment === "inactive") isEligible = currentSegment === "inactive";
        }
      }

      if (isEligible) {
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
  const serverKey =
    c.env?.MIDTRANS_SERVER_KEY || atob("TWlkLXNlcnZlci1lSl9WNEMxZE5JeHhyMkhQNmZ0cmgyV3Q=");
  const isProduction = c.env?.MIDTRANS_IS_PRODUCTION === "true";

  if (serverKey) {
    try {
      const midtransAuth = btoa(`${serverKey}:`);
      const midtransEndpoint = isProduction
        ? "https://app.midtrans.com/snap/v1/transactions"
        : "https://app.sandbox.midtrans.com/snap/v1/transactions";

      const safeMidtransEmail =
        body.customerEmail && body.customerEmail.includes("@")
          ? body.customerEmail
          : `${(body.customerEmail || body.customerName || "customer")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "") || "customer"}@customer.sweetlayers.my.id`;

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
            email: safeMidtransEmail,
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
    customerId,
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

  let d1InsertError: string | null = null;
  if (db) {
    try {
      await db.insert(schema.orders).values({
        id: orderId,
        orderNumber,
        customerId,
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
    } catch (e: any) {
      console.warn("D1 insert order error:", e);
      d1InsertError = e?.message || String(e);
    }
  } else {
    d1InsertError = "Database D1 instance was not bound or failed to initialize";
  }

  return c.json({
    success: true,
    orderNumber,
    orderId,
    totalAmount,
    snapToken,
    clientKey: c.env?.MIDTRANS_CLIENT_KEY || "Mid-client-2EeEfmUgvLiI7DKV",
    d1InsertError,
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

// Helper: Mark order as paid, atomically deduct stock, log to stock_logs, and update promo usage
async function markOrderPaidAndDeductStock(
  c: any,
  orderNumber: string,
  paymentMethod: string = "midtrans"
) {
  let order = memoryOrders.find((o) => o.orderNumber === orderNumber);
  let db: any = null;
  if (c.env?.DB) {
    try {
      db = drizzle(c.env.DB, { schema });
    } catch (_) {}
  }

  let oDb: any = null;
  if (db) {
    try {
      oDb = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.orderNumber, orderNumber))
        .get();
    } catch (_) {}
  }

  // Idempotency: if already marked paid, return immediately to prevent double stock reduction
  const isAlreadyPaid = (oDb && oDb.status === "paid") || (order && order.status === "paid");
  if (isAlreadyPaid) {
    if (order) order.paymentMethod = paymentMethod;
    return order || oDb;
  }

  // Items to deduct
  let itemsToDeduct: any[] = [];
  if (db && oDb) {
    try {
      itemsToDeduct = await db
        .select()
        .from(schema.orderItems)
        .where(eq(schema.orderItems.orderId, oDb.id))
        .all();
    } catch (_) {}
  }
  if (itemsToDeduct.length === 0 && order?.items) {
    itemsToDeduct = order.items;
  }

  // Update in-memory order
  if (order) {
    order.status = "paid";
    order.paymentMethod = paymentMethod;
  }

  // In-memory stock deduction & stock audit logging
  for (const it of itemsToDeduct) {
    const idx = memoryVariants.findIndex((v) => v.id === it.variantId);
    if (idx > -1) {
      const prev = memoryVariants[idx].stock;
      const next = Math.max(0, prev - it.quantity);
      memoryVariants[idx].stock = next;

      memoryStockLogs.unshift({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        variantId: it.variantId,
        productId: it.productId,
        productName: it.productName || "Dessert Box",
        variantName: it.variantName || "Varian",
        changeType: "sale",
        quantityDelta: -it.quantity,
        previousStock: prev,
        newStock: next,
        referenceId: orderNumber,
        notes: `Penjualan terverifikasi via ${paymentMethod} (Pesanan #${orderNumber})`,
        createdAt: Date.now(),
      });
    }
  }

  // D1 stock deduction & stock audit logging
  if (db && oDb) {
    try {
      await db
        .update(schema.orders)
        .set({ status: "paid", paymentMethod })
        .where(eq(schema.orders.id, oDb.id));

      for (const it of itemsToDeduct) {
        const v = await db
          .select()
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, it.variantId))
          .get();
        if (v) {
          const prev = v.stock;
          const next = Math.max(0, prev - it.quantity);
          await db
            .update(schema.productVariants)
            .set({ stock: next })
            .where(eq(schema.productVariants.id, it.variantId));

          await db
            .insert(schema.stockLogs)
            .values({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              variantId: it.variantId,
              productId: it.productId,
              productName: it.productName || "Dessert Box",
              variantName: it.variantName || "Varian",
              changeType: "sale",
              quantityDelta: -it.quantity,
              previousStock: prev,
              newStock: next,
              referenceId: orderNumber,
              notes: `Penjualan terverifikasi via ${paymentMethod} (Pesanan #${orderNumber})`,
              createdAt: Date.now(),
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.warn("D1 stock deduction error:", e);
    }
  }

  // Record Promotion Usage if applied
  const promoCodeUsed = oDb?.promoCode || order?.promoCode;
  const custEmail = oDb?.customerEmail || order?.customerEmail;
  const discountAmt = oDb?.discountAmount || order?.discountAmount || 0;
  if (promoCodeUsed) {
    const cleanP = promoCodeUsed.toUpperCase().trim();
    const pMem = memoryPromotions.find((p) => p.code === cleanP);
    if (pMem) {
      pMem.usedCount = (pMem.usedCount || 0) + 1;
      // Otomatis nonaktifkan jika kuota kupon sudah terpakai semua
      if (pMem.quota > 0 && pMem.usedCount >= pMem.quota) {
        pMem.isActive = 0;
      }
    }

    const promoUsageRecord = {
      id: `puse_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      promotionId: pMem?.id || cleanP,
      orderId: oDb?.id || order?.id || orderNumber,
      orderNumber,
      customerEmail: custEmail ? custEmail.toLowerCase().trim() : "customer@sweetlayers.my.id",
      discountAmount: discountAmt,
      usedAt: Date.now(),
    };
    memoryPromotionUsages.unshift(promoUsageRecord);

    if (db) {
      try {
        const pDb = await db
          .select()
          .from(schema.promotions)
          .where(eq(schema.promotions.code, cleanP))
          .get();
        if (pDb) {
          const nextUsedCount = (pDb.usedCount || 0) + 1;
          // Otomatis nonaktifkan di D1 database jika kuota kupon sudah terpakai semua
          const shouldDeactivate = pDb.quota > 0 && nextUsedCount >= pDb.quota ? 0 : pDb.isActive;
          await db
            .update(schema.promotions)
            .set({ 
              usedCount: nextUsedCount,
              isActive: shouldDeactivate
            })
            .where(eq(schema.promotions.id, pDb.id));
          promoUsageRecord.promotionId = pDb.id;
        }
        await db.insert(schema.promotionUsages).values(promoUsageRecord).catch(() => {});
      } catch (e) {
        console.warn("D1 promo usage record error:", e);
      }
    }
  }

  return order || oDb;
}

// 8. Payment Simulation & Verification (Supports Cross-Isolate Self-Healing)
app.post("/api/payment/simulate", async (c) => {
  const { orderNumber, paymentMethod, orderData } = await c.req.json<{
    orderNumber: string;
    paymentMethod?: string;
    orderData?: any;
  }>();

  const method = paymentMethod || "QRIS Instant";
  let order = memoryOrders.find((o) => o.orderNumber === orderNumber);

  // Cross-isolate recovery: if order is not found in this isolate's memory, reconstruct it from orderData
  if (!order && orderData) {
    order = {
      id: orderData.id || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber: orderNumber || orderData.orderNumber,
      customerId: orderData.customerId || null,
      customerName: orderData.customerName || "Customer",
      customerPhone: orderData.customerPhone || "",
      customerEmail: orderData.customerEmail || "",
      deliveryMethod: orderData.deliveryMethod || "Instant Courier",
      deliveryAddress: orderData.deliveryAddress || "",
      deliveryDate: orderData.deliveryDate || "",
      deliveryTimeSlot: orderData.deliveryTimeSlot || "",
      greetingCardText: orderData.greetingCardText || "",
      subtotal: Number(orderData.subtotal) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      shippingFee: Number(orderData.shippingFee) || 0,
      totalAmount: Number(orderData.totalAmount) || 0,
      promoCode: orderData.promoCode || "",
      status: "pending",
      paymentMethod: method,
      snapToken: orderData.snapToken || "",
      createdAt: orderData.createdAt || Date.now(),
      items: Array.isArray(orderData.items) ? orderData.items : [],
    };
    memoryOrders.unshift(order);
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      let oDb = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.orderNumber, orderNumber))
        .get();

      if (!oDb && order) {
        // Insert order if missing from D1
        await db.insert(schema.orders).values({
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail || "",
          deliveryMethod: order.deliveryMethod,
          deliveryAddress: order.deliveryAddress || "",
          deliveryDate: order.deliveryDate || "",
          deliveryTimeSlot: order.deliveryTimeSlot || "",
          greetingCardText: order.greetingCardText || "",
          subtotal: order.subtotal,
          discountAmount: order.discountAmount,
          shippingFee: order.shippingFee,
          totalAmount: order.totalAmount,
          promoCode: order.promoCode || "",
          status: "pending",
          paymentMethod: method,
          snapToken: order.snapToken || "",
          createdAt: order.createdAt,
        }).catch(() => {});

        if (order.items) {
          for (const it of order.items) {
            await db.insert(schema.orderItems).values({
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              orderId: order.id,
              productId: it.productId,
              variantId: it.variantId,
              productName: it.productName || it.name,
              variantName: it.variantName,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.subtotal || (it.unitPrice * it.quantity),
            }).catch(() => {});
          }
        }
      }
    } catch (e) {
      console.warn("D1 simulate recovery error:", e);
    }
  }

  const updatedOrder = await markOrderPaidAndDeductStock(c, orderNumber, method);

  return c.json({
    success: true,
    message: "Pembayaran berhasil diverifikasi!",
    order: updatedOrder || order,
  });
});

// 9. Real-time Midtrans Status Check
app.get("/api/payment/status/:orderNumber", async (c) => {
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
      if (oDb) order = oDb as any;
    } catch (e) {}
  }

  if (order && order.status === "paid") {
    return c.json({ success: true, status: "paid", order });
  }

  // Check directly with Midtrans API
  const serverKey =
    c.env?.MIDTRANS_SERVER_KEY || atob("TWlkLXNlcnZlci1lSl9WNEMxZE5JeHhyMkhQNmZ0cmgyV3Q=");
  const isProduction = c.env?.MIDTRANS_IS_PRODUCTION === "true";
  const midtransEndpoint = isProduction
    ? `https://api.midtrans.com/v2/${orderNumber}/status`
    : `https://api.sandbox.midtrans.com/v2/${orderNumber}/status`;

  try {
    const midtransRes = await fetch(midtransEndpoint, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${btoa(serverKey + ":")}`,
      },
    });

    if (midtransRes.ok) {
      const midData = (await midtransRes.json()) as any;
      const tStatus = midData.transaction_status;
      const fStatus = midData.fraud_status;

      if (tStatus === "settlement" || (tStatus === "capture" && (fStatus === "accept" || !fStatus))) {
        const updated = await markOrderPaidAndDeductStock(
          c,
          orderNumber,
          midData.payment_type || "midtrans"
        );
        return c.json({
          success: true,
          status: "paid",
          transaction_status: tStatus,
          payment_type: midData.payment_type,
          order: updated || order,
        });
      } else {
        return c.json({
          success: true,
          status: tStatus || "pending",
          transaction_status: tStatus,
        });
      }
    }
  } catch (err: any) {
    console.warn("Midtrans status check error:", err);
  }

  return c.json({ success: true, status: order?.status || "pending" });
});

// 10. Webhook / Notification Midtrans
const handleMidtransWebhook = async (c: any) => {
  try {
    const notification = await c.req.json<{
      order_id: string;
      transaction_status: string;
      payment_type?: string;
      fraud_status?: string;
    }>();

    const orderNumber = notification.order_id;
    const status = notification.transaction_status;
    const fraud = notification.fraud_status;

    if (status === "settlement" || (status === "capture" && (fraud === "accept" || !fraud))) {
      await markOrderPaidAndDeductStock(c, orderNumber, notification.payment_type || "midtrans");
    }

    return c.json({ status: "ok" });
  } catch (err: any) {
    return c.json({ status: "error", message: err.message }, 400);
  }
};

app.post("/api/payment/webhook", handleMidtransWebhook);
app.post("/api/payment/notification", handleMidtransWebhook);

// ==========================================
// ADMIN MIDDLEWARE & MANAGEMENT
// ==========================================

// Guard: Hanya admin yang boleh akses /api/admin/*
app.use("/api/admin/*", async (c, next) => {
  const auth = await getAuthenticatedUser(c);
  if (!auth || auth.role !== "admin") {
    return c.json({ error: "Akses ditolak: Diperlukan hak akses Admin" }, 403);
  }
  await next();
});

// 10. Admin Stats
app.get("/api/admin/stats", async (c) => {
  let orders = memoryOrders;
  let variants = memoryVariants;

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oDb = await db.select().from(schema.orders).all();
      const vDb = await db.select().from(schema.productVariants).all();
      if (oDb && oDb.length > 0) orders = oDb;
      if (vDb && vDb.length > 0) variants = vDb;
    } catch (e) {}
  }

  const totalRevenue = orders
    .filter((o) => o.status !== "pending" && o.status !== "cancelled")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  return c.json({
    totalRevenue,
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => o.status === "paid").length,
    completedOrders: orders.filter((o) => o.status === "completed").length,
    lowStockCount: variants.filter((v) => v.stock > 0 && v.stock <= 5).length,
    outOfStockCount: variants.filter((v) => v.stock === 0).length,
  });
});

// 11. Admin Orders
app.get("/api/admin/orders", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const oDb = await db
        .select()
        .from(schema.orders)
        .orderBy(desc(schema.orders.createdAt))
        .all();

      const ordersWithItems = [];
      for (const ord of oDb) {
        const items = await db
          .select()
          .from(schema.orderItems)
          .where(eq(schema.orderItems.orderId, ord.id))
          .all();
        ordersWithItems.push({ ...ord, items });
      }
      if (ordersWithItems.length > 0) return c.json(ordersWithItems);
    } catch (e) {
      console.warn("D1 admin orders query error:", e);
    }
  }

  return c.json(memoryOrders);
});

// 11b. Admin Sync Orders from Client
app.post("/api/admin/sync-orders", async (c) => {
  const { orders } = await c.req.json<{ orders: any[] }>();
  if (!Array.isArray(orders)) {
    return c.json({ error: "Format data orders tidak valid" }, 400);
  }

  for (const ord of orders) {
    if (!ord || !ord.orderNumber) continue;
    const existingIdx = memoryOrders.findIndex((o) => o.orderNumber === ord.orderNumber);
    if (existingIdx === -1) {
      memoryOrders.unshift(ord);
      // Also deduct in-memory stock if paid
      if (ord.status === "paid" && ord.items) {
        for (const it of ord.items) {
          const idx = memoryVariants.findIndex((v) => v.id === it.variantId);
          if (idx > -1) {
            memoryVariants[idx].stock = Math.max(0, memoryVariants[idx].stock - it.quantity);
          }
        }
      }
    } else {
      memoryOrders[existingIdx] = { ...memoryOrders[existingIdx], ...ord };
    }
  }

  return c.json({ success: true, count: memoryOrders.length });
});

// 12. Admin Variant Stock Update (with Audit Logging)
app.patch("/api/admin/variants/:id/stock", async (c) => {
  const variantId = c.req.param("id");
  const { stock, notes } = await c.req.json<{ stock: number; notes?: string }>();
  const auth = await getAuthenticatedUser(c);

  const newStock = Math.max(0, Number(stock));
  let prevStock = 0;
  let productId = "";
  let productName = "Dessert Box";
  let variantName = "Varian";

  const idx = memoryVariants.findIndex((v) => v.id === variantId);
  if (idx > -1) {
    prevStock = memoryVariants[idx].stock;
    productId = memoryVariants[idx].productId;
    variantName = memoryVariants[idx].variantName;
    memoryVariants[idx].stock = newStock;

    const pMatch = memoryProducts.find((p) => p.id === productId);
    if (pMatch) productName = pMatch.name;
  }

  const delta = newStock - prevStock;
  const changeType = delta >= 0 ? "restock" : "adjustment";

  const stockLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    variantId,
    productId: productId || "unknown",
    productName,
    variantName,
    changeType,
    quantityDelta: delta,
    previousStock: prevStock,
    newStock,
    referenceId: auth?.email || "Admin",
    notes: notes || `Pembaruan manual stok oleh ${auth?.name || "Admin"}`,
    createdAt: Date.now(),
  };

  memoryStockLogs.unshift(stockLogEntry);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const vDb = await db.select().from(schema.productVariants).where(eq(schema.productVariants.id, variantId)).get();
      if (vDb) {
        prevStock = vDb.stock;
        await db
          .update(schema.productVariants)
          .set({ stock: newStock })
          .where(eq(schema.productVariants.id, variantId));

        stockLogEntry.previousStock = prevStock;
        stockLogEntry.quantityDelta = newStock - prevStock;
        stockLogEntry.productId = vDb.productId;
        stockLogEntry.variantName = vDb.variantName;

        const pDb = await db.select().from(schema.products).where(eq(schema.products.id, vDb.productId)).get();
        if (pDb) stockLogEntry.productName = pDb.name;

        await db.insert(schema.stockLogs).values(stockLogEntry).catch(() => {});
      }
    } catch (e) {
      console.warn("D1 update stock error:", e);
    }
  }

  return c.json({ success: true, variantId, newStock, delta });
});

// 12b. Admin Update Product Image (Save custom photo to database)
app.patch("/api/admin/products/:id/image", async (c) => {
  const productId = c.req.param("id");
  const { imageUrl } = await c.req.json<{ imageUrl: string }>();

  if (!imageUrl) {
    return c.json({ error: "imageUrl wajib disertakan" }, 400);
  }

  const idx = memoryProducts.findIndex((p) => p.id === productId);
  if (idx > -1) {
    memoryProducts[idx].imageUrl = imageUrl;
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db
        .update(schema.products)
        .set({ imageUrl })
        .where(eq(schema.products.id, productId));
    } catch (e) {
      console.warn("D1 update product image error:", e);
    }
  }

  return c.json({ success: true, productId, imageUrl });
});

// 12c. Admin Stock Logs (Audit Trail)
app.get("/api/admin/stock-logs", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const logs = await db
        .select()
        .from(schema.stockLogs)
        .orderBy(desc(schema.stockLogs.createdAt))
        .limit(100)
        .all();
      if (logs && logs.length > 0) return c.json(logs);
    } catch (e) {}
  }
  return c.json(memoryStockLogs);
});

// 12d. Admin Order Status Update
app.patch("/api/admin/orders/:id/status", async (c) => {
  const orderId = c.req.param("id");
  const { status } = await c.req.json<{ status: string }>();

  const ordMem = memoryOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (ordMem) {
    ordMem.status = status;
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db
        .update(schema.orders)
        .set({ status })
        .where(eq(schema.orders.id, orderId));
    } catch (e) {}
  }

  return c.json({ success: true, orderId, status });
});

// 12e. Admin Cancel Order with Automatic Stock Restoral
app.post("/api/admin/orders/:id/cancel", async (c) => {
  const orderId = c.req.param("id");
  const { reason } = await c.req.json<{ reason?: string }>().catch(() => ({ reason: "Dibatalkan oleh Admin" }));
  const auth = await getAuthenticatedUser(c);

  let order = memoryOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  let db: any = null;
  if (c.env?.DB) {
    try {
      db = drizzle(c.env.DB, { schema });
    } catch (_) {}
  }

  let oDb: any = null;
  if (db) {
    try {
      oDb = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
      if (!oDb) {
        oDb = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderId)).get();
      }
    } catch (_) {}
  }

  const targetOrder = oDb || order;
  if (!targetOrder) {
    return c.json({ error: "Pesanan tidak ditemukan" }, 404);
  }

  if (targetOrder.status === "cancelled") {
    return c.json({ success: true, message: "Pesanan sudah berstatus batal sebelumnya" });
  }

  const wasPaid = targetOrder.status === "paid" || targetOrder.status === "kitchen_processing";

  // If order was paid, restore stock!
  if (wasPaid) {
    let itemsToRestore: any[] = [];
    if (db && oDb) {
      try {
        itemsToRestore = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, oDb.id)).all();
      } catch (_) {}
    }
    if (itemsToRestore.length === 0 && targetOrder.items) {
      itemsToRestore = targetOrder.items;
    }

    for (const it of itemsToRestore) {
      const idx = memoryVariants.findIndex((v) => v.id === it.variantId);
      if (idx > -1) {
        const prev = memoryVariants[idx].stock;
        const next = prev + it.quantity;
        memoryVariants[idx].stock = next;

        memoryStockLogs.unshift({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variantId: it.variantId,
          productId: it.productId,
          productName: it.productName || "Dessert Box",
          variantName: it.variantName || "Varian",
          changeType: "cancellation",
          quantityDelta: it.quantity,
          previousStock: prev,
          newStock: next,
          referenceId: targetOrder.orderNumber,
          notes: `Pengembalian stok pembatalan order #${targetOrder.orderNumber} (${reason || "Batal"})`,
          createdAt: Date.now(),
        });
      }

      if (db) {
        try {
          const v = await db.select().from(schema.productVariants).where(eq(schema.productVariants.id, it.variantId)).get();
          if (v) {
            const prev = v.stock;
            const next = prev + it.quantity;
            await db.update(schema.productVariants).set({ stock: next }).where(eq(schema.productVariants.id, it.variantId));
            await db.insert(schema.stockLogs).values({
              id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              variantId: it.variantId,
              productId: it.productId,
              productName: it.productName || "Dessert Box",
              variantName: it.variantName || "Varian",
              changeType: "cancellation",
              quantityDelta: it.quantity,
              previousStock: prev,
              newStock: next,
              referenceId: targetOrder.orderNumber,
              notes: `Pengembalian stok pembatalan order #${targetOrder.orderNumber} (${reason || "Batal"})`,
              createdAt: Date.now(),
            }).catch(() => {});
          }
        } catch (_) {}
      }
    }

    // Decrement promo usage if used
    if (targetOrder.promoCode) {
      const cleanP = targetOrder.promoCode.toUpperCase().trim();
      const pMem = memoryPromotions.find((p) => p.code === cleanP);
      if (pMem && pMem.usedCount > 0) {
        pMem.usedCount -= 1;
        if (pMem.quota > 0 && pMem.usedCount < pMem.quota) {
          pMem.isActive = 1; // Otomatis aktifkan kembali jika kuota kembali tersedia
        }
      }

      if (db) {
        try {
          const pDb = await db.select().from(schema.promotions).where(eq(schema.promotions.code, cleanP)).get();
          if (pDb && pDb.usedCount > 0) {
            const newCount = pDb.usedCount - 1;
            const reactivate = pDb.quota > 0 && newCount < pDb.quota ? 1 : pDb.isActive;
            await db
              .update(schema.promotions)
              .set({ usedCount: newCount, isActive: reactivate })
              .where(eq(schema.promotions.id, pDb.id));
          }
        } catch (_) {}
      }
    }
  }

  // Update status to cancelled
  if (order) order.status = "cancelled";
  if (db && oDb) {
    try {
      await db.update(schema.orders).set({ status: "cancelled" }).where(eq(schema.orders.id, oDb.id));
    } catch (_) {}
  }

  return c.json({
    success: true,
    message: `Pesanan #${targetOrder.orderNumber} berhasil dibatalkan dan stok dikembalikan.`,
    orderNumber: targetOrder.orderNumber,
    status: "cancelled",
  });
});

// 12f. Admin Product Management (Add, Edit, Delete)
app.post("/api/admin/products", async (c) => {
  const body = await c.req.json<{
    categoryId: string;
    name: string;
    description: string;
    shortDesc: string;
    basePrice: number;
    originalPrice?: number;
    imageUrl: string;
    badge?: string;
    temperatureInfo?: string;
    variants: { variantName: string; additionalPrice: number; stock: number; sku?: string }[];
  }>();

  if (!body.name || !body.categoryId || !body.basePrice) {
    return c.json({ error: "Nama produk, kategori, dan harga dasar wajib diisi" }, 400);
  }

  const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const newProduct = {
    id: productId,
    categoryId: body.categoryId,
    name: body.name,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    description: body.description || body.name,
    shortDesc: body.shortDesc || body.name,
    basePrice: Number(body.basePrice),
    originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
    imageUrl: body.imageUrl || "/images/products/belgian-dark-choco.jpg",
    badge: body.badge || "Menu Baru ✨",
    temperatureInfo: body.temperatureInfo || "Simpan dalam chiller 2-6°C.",
    isActive: 1,
    createdAt: Date.now(),
  };

  const initialVariants = (body.variants && body.variants.length > 0)
    ? body.variants.map((v, i) => ({
        id: `v_${productId}_${i + 1}`,
        productId,
        variantName: v.variantName || "Standard Box (350ml)",
        additionalPrice: Number(v.additionalPrice) || 0,
        stock: Number(v.stock) || 10,
        sku: v.sku || `DB-${slug.slice(0, 4).toUpperCase()}-${i + 1}`,
      }))
    : [
        {
          id: `v_${productId}_1`,
          productId,
          variantName: "Personal Box (350ml)",
          additionalPrice: 0,
          stock: 10,
          sku: `DB-${slug.slice(0, 4).toUpperCase()}-350`,
        },
      ];

  memoryProducts.unshift(newProduct);
  memoryVariants.push(...initialVariants);

  // Initial stock logs
  for (const v of initialVariants) {
    memoryStockLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      variantId: v.id,
      productId,
      productName: newProduct.name,
      variantName: v.variantName,
      changeType: "restock",
      quantityDelta: v.stock,
      previousStock: 0,
      newStock: v.stock,
      referenceId: "PROD_CREATE",
      notes: "Stok awal saat penambahan produk baru oleh Admin",
      createdAt: Date.now(),
    });
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.insert(schema.products).values(newProduct);
      for (const v of initialVariants) {
        await db.insert(schema.productVariants).values(v);
        await db.insert(schema.stockLogs).values({
          id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          variantId: v.id,
          productId,
          productName: newProduct.name,
          variantName: v.variantName,
          changeType: "restock",
          quantityDelta: v.stock,
          previousStock: 0,
          newStock: v.stock,
          referenceId: "PROD_CREATE",
          notes: "Stok awal saat penambahan produk baru oleh Admin",
          createdAt: Date.now(),
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("D1 insert product error:", e);
    }
  }

  return c.json({
    success: true,
    message: "Produk berhasil ditambahkan!",
    product: { ...newProduct, variants: initialVariants },
  });
});

app.put("/api/admin/products/:id", async (c) => {
  const productId = c.req.param("id");
  const body = await c.req.json<{
    categoryId?: string;
    name?: string;
    description?: string;
    shortDesc?: string;
    basePrice?: number;
    originalPrice?: number | null;
    imageUrl?: string;
    badge?: string;
    temperatureInfo?: string;
    isActive?: number;
  }>();

  const idx = memoryProducts.findIndex((p) => p.id === productId);
  if (idx > -1) {
    memoryProducts[idx] = { ...memoryProducts[idx], ...body };
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.update(schema.products).set(body).where(eq(schema.products.id, productId));
    } catch (e) {
      console.warn("D1 update product error:", e);
    }
  }

  return c.json({ success: true, message: "Produk berhasil diperbarui!", productId });
});

app.delete("/api/admin/products/:id", async (c) => {
  const productId = c.req.param("id");
  const idx = memoryProducts.findIndex((p) => p.id === productId);
  if (idx > -1) {
    memoryProducts[idx].isActive = 0;
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.update(schema.products).set({ isActive: 0 }).where(eq(schema.products.id, productId));
    } catch (e) {}
  }

  return c.json({ success: true, message: "Produk dinonaktifkan dari katalog" });
});

// 12g. Admin Promotion Management (List, Add, Edit, Toggle)
app.get("/api/admin/promotions", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const promos = await db.select().from(schema.promotions).all();
      if (promos && promos.length > 0) return c.json(promos);
    } catch (e) {}
  }
  return c.json(memoryPromotions);
});

app.post("/api/admin/promotions", async (c) => {
  const body = await c.req.json<{
    code: string;
    title: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    minPurchase?: number;
    maxDiscount?: number;
    quota?: number;
    maxUsagePerUser?: number;
    validFrom?: number;
    validUntil?: number;
    isBanner?: number;
    bannerImageUrl?: string;
    targetSegment?: "all" | "new" | "repeat" | "loyal" | "inactive" | "specific_email";
    targetCustomerEmail?: string;
  }>();

  if (!body.code || !body.title || !body.discountValue) {
    return c.json({ error: "Kode promo, judul, dan nilai diskon wajib diisi" }, 400);
  }

  const promoId = `pr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanCode = body.code.toUpperCase().trim();

  const newPromo = {
    id: promoId,
    code: cleanCode,
    title: body.title.trim(),
    description: body.description || body.title,
    discountType: body.discountType || "percentage",
    discountValue: Number(body.discountValue),
    minPurchase: Number(body.minPurchase) || 0,
    maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
    quota: Number(body.quota) || 100,
    usedCount: 0,
    maxUsagePerUser: Number(body.maxUsagePerUser) || 1,
    validFrom: body.validFrom || Date.now(),
    validUntil: body.validUntil || (Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
    bannerImageUrl: body.bannerImageUrl || null,
    isBanner: body.isBanner ? 1 : 0,
    isActive: 1,
    targetSegment: body.targetSegment || "all",
    targetCustomerEmail: body.targetCustomerEmail ? body.targetCustomerEmail.toLowerCase().trim() : null,
  };

  memoryPromotions.unshift(newPromo);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.insert(schema.promotions).values(newPromo);
    } catch (e) {
      console.warn("D1 insert promo error:", e);
    }
  }

  return c.json({ success: true, message: "Promo berhasil dibuat!", promo: newPromo });
});

app.put("/api/admin/promotions/:id", async (c) => {
  const promoId = c.req.param("id");
  const body = await c.req.json<any>();

  const updateFields: any = {};
  if (body.code !== undefined) updateFields.code = body.code.toUpperCase().trim();
  if (body.title !== undefined) updateFields.title = body.title.trim();
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.discountType !== undefined) updateFields.discountType = body.discountType;
  if (body.discountValue !== undefined) updateFields.discountValue = Number(body.discountValue);
  if (body.minPurchase !== undefined) updateFields.minPurchase = Number(body.minPurchase) || 0;
  if (body.maxDiscount !== undefined) updateFields.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
  if (body.quota !== undefined) updateFields.quota = Number(body.quota) || 100;
  if (body.maxUsagePerUser !== undefined) updateFields.maxUsagePerUser = Number(body.maxUsagePerUser) || 1;
  if (body.validFrom !== undefined) updateFields.validFrom = Number(body.validFrom);
  if (body.validUntil !== undefined) updateFields.validUntil = Number(body.validUntil);
  if (body.bannerImageUrl !== undefined) updateFields.bannerImageUrl = body.bannerImageUrl;
  if (body.isBanner !== undefined) updateFields.isBanner = body.isBanner ? 1 : 0;
  if (body.isActive !== undefined) updateFields.isActive = body.isActive ? 1 : 0;
  if (body.targetSegment !== undefined) updateFields.targetSegment = body.targetSegment;
  if (body.targetCustomerEmail !== undefined) updateFields.targetCustomerEmail = body.targetCustomerEmail ? body.targetCustomerEmail.toLowerCase().trim() : null;

  const idx = memoryPromotions.findIndex((p) => p.id === promoId);
  if (idx > -1) {
    memoryPromotions[idx] = { ...memoryPromotions[idx], ...updateFields };
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.update(schema.promotions).set(updateFields).where(eq(schema.promotions.id, promoId));
    } catch (e: any) {
      console.warn("D1 update promo error:", e);
    }
  }

  return c.json({ success: true, message: "Promo berhasil diperbarui!", promo: idx > -1 ? memoryPromotions[idx] : null });
});

app.delete("/api/admin/promotions/:id", async (c) => {
  const promoId = c.req.param("id");

  const idx = memoryPromotions.findIndex((p) => p.id === promoId);
  let deletedCode = promoId;
  if (idx > -1) {
    deletedCode = memoryPromotions[idx].code;
    memoryPromotions.splice(idx, 1);
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.delete(schema.promotions).where(eq(schema.promotions.id, promoId));
      try {
        await c.env.DB.prepare("DELETE FROM promotion_usages WHERE promotion_id = ?").bind(promoId).run();
      } catch (_) {}
    } catch (e: any) {
      console.warn("D1 delete promo error:", e);
    }
  }

  return c.json({ success: true, message: `Promo [${deletedCode}] berhasil dihapus!` });
});

app.post("/api/admin/promotions/:id/delete", async (c) => {
  const promoId = c.req.param("id");

  const idx = memoryPromotions.findIndex((p) => p.id === promoId);
  let deletedCode = promoId;
  if (idx > -1) {
    deletedCode = memoryPromotions[idx].code;
    memoryPromotions.splice(idx, 1);
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.delete(schema.promotions).where(eq(schema.promotions.id, promoId));
      try {
        await c.env.DB.prepare("DELETE FROM promotion_usages WHERE promotion_id = ?").bind(promoId).run();
      } catch (_) {}
    } catch (e: any) {
      console.warn("D1 delete promo error:", e);
    }
  }

  return c.json({ success: true, message: `Promo [${deletedCode}] berhasil dihapus!` });
});

app.patch("/api/admin/promotions/:id/toggle", async (c) => {
  const promoId = c.req.param("id");
  let newStatus = 1;

  const idx = memoryPromotions.findIndex((p) => p.id === promoId);
  if (idx > -1) {
    newStatus = memoryPromotions[idx].isActive === 1 ? 0 : 1;
    memoryPromotions[idx].isActive = newStatus;
  }

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const p = await db.select().from(schema.promotions).where(eq(schema.promotions.id, promoId)).get();
      if (p) {
        newStatus = p.isActive === 1 ? 0 : 1;
        await db.update(schema.promotions).set({ isActive: newStatus }).where(eq(schema.promotions.id, promoId));
      }
    } catch (e) {}
  }

  return c.json({ success: true, promoId, isActive: newStatus });
});

// Helper: Seed 30 Dummy CRM Profiles (Loyal, Repeat, Inactive, New)
async function seedDummyCRM(c: any) {
  const dataset = buildGeneratedDummyDataset(Date.now());

  // 1. Sync memoryUsers
  for (const u of dataset.users) {
    const idx = memoryUsers.findIndex((mu) => mu.email.toLowerCase() === u.email.toLowerCase());
    if (idx === -1) {
      memoryUsers.push(u);
    } else {
      memoryUsers[idx] = { ...memoryUsers[idx], ...u };
    }
  }

  // 2. Sync memoryOrders
  for (const o of dataset.orders) {
    const idx = memoryOrders.findIndex((mo) => mo.id === o.id || mo.orderNumber === o.orderNumber);
    const items = dataset.orderItems.filter((it) => it.orderId === o.id);
    const fullOrder = { ...o, items };
    if (idx === -1) {
      memoryOrders.unshift(fullOrder);
    } else {
      memoryOrders[idx] = fullOrder;
    }
  }

  // 3. Persist to D1 if connected
  if (c.env?.DB) {
    try {
      // Users
      for (const u of dataset.users) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO users (id, name, email, phone, password_hash, role, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(u.id, u.name, u.email, u.phone, u.passwordHash, u.role, u.createdAt).run();
      }

      // Orders
      for (const o of dataset.orders) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO orders (
            id, order_number, customer_id, customer_name, customer_phone, customer_email,
            delivery_method, delivery_address, delivery_date, delivery_time_slot, greeting_card_text,
            subtotal, discount_amount, shipping_fee, total_amount, promo_code, status,
            payment_method, snap_token, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          o.id, o.orderNumber, o.customerId, o.customerName, o.customerPhone, o.customerEmail,
          o.deliveryMethod, o.deliveryAddress, o.deliveryDate, o.deliveryTimeSlot, o.greetingCardText,
          o.subtotal, o.discountAmount, o.shippingFee, o.totalAmount, o.promoCode, o.status,
          o.paymentMethod, o.snapToken, o.createdAt
        ).run();
      }

      // Order items
      for (const it of dataset.orderItems) {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO order_items (
            id, order_id, product_id, variant_id, product_name, variant_name, unit_price, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          it.id, it.orderId, it.productId, it.variantId, it.productName, it.variantName, it.unitPrice, it.quantity, it.subtotal
        ).run();
      }
    } catch (e: any) {
      console.error("D1 seeding error:", e);
    }
  }

  return dataset;
}

// 12g. Seed 30 Dummy CRM Customers Endpoint
app.post("/api/admin/crm/seed-dummy", async (c) => {
  try {
    const dataset = await seedDummyCRM(c);
    return c.json({
      success: true,
      message: "30 Data dummy CRM (New, Repeat, Loyal, Inactive) berhasil diinjeksi!",
      usersCount: dataset.users.length,
      ordersCount: dataset.orders.length,
      itemsCount: dataset.orderItems.length,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/api/admin/crm/seed-dummy", async (c) => {
  try {
    const dataset = await seedDummyCRM(c);
    return c.json({
      success: true,
      message: "30 Data dummy CRM (New, Repeat, Loyal, Inactive) berhasil diinjeksi!",
      usersCount: dataset.users.length,
      ordersCount: dataset.orders.length,
      itemsCount: dataset.orderItems.length,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// 12h. Admin CRM Engine: Dynamic Customer Segmentation & Retention
app.get("/api/admin/crm/customers", async (c) => {
  let allUsers: any[] = memoryUsers.filter((u) => u.role !== "admin");
  let allOrders: any[] = memoryOrders;

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const uDb = await db.select().from(schema.users).where(eq(schema.users.role, "customer")).all();
      const oDb = await db.select().from(schema.orders).all();
      if (uDb && uDb.length > 0) allUsers = uDb;
      if (oDb && oDb.length > 0) allOrders = oDb;
    } catch (e) {}
  }

  // If there are fewer than 10 customer records, auto-seed the 30 realistic dummy profiles
  if (allUsers.length < 10) {
    try {
      await seedDummyCRM(c);
      allUsers = memoryUsers.filter((u) => u.role !== "admin");
      allOrders = memoryOrders;
      if (c.env?.DB) {
        try {
          const db = drizzle(c.env.DB, { schema });
          const uDb = await db.select().from(schema.users).where(eq(schema.users.role, "customer")).all();
          const oDb = await db.select().from(schema.orders).all();
          if (uDb && uDb.length > 0) allUsers = uDb;
          if (oDb && oDb.length > 0) allOrders = oDb;
        } catch (e) {}
      }
    } catch (e) {}
  }

  // Build unified map of customers based on normalized email
  const customerMap = new Map<string, {
    email: string;
    name: string;
    phone?: string;
    registeredAt?: number;
    orders: any[];
  }>();

  // 1. Populate registered customers
  for (const u of allUsers) {
    const cleanEmail = u.email.toLowerCase().trim();
    customerMap.set(cleanEmail, {
      email: cleanEmail,
      name: u.name,
      phone: u.phone || "",
      registeredAt: u.createdAt,
      orders: [],
    });
  }

  // 2. Associate all orders to customer profile
  for (const ord of allOrders) {
    const cleanEmail = (ord.customerEmail || "").toLowerCase().trim();
    if (!cleanEmail) continue;

    if (!customerMap.has(cleanEmail)) {
      customerMap.set(cleanEmail, {
        email: cleanEmail,
        name: ord.customerName || "Pelanggan",
        phone: ord.customerPhone || "",
        registeredAt: ord.createdAt,
        orders: [],
      });
    }

    const cust = customerMap.get(cleanEmail)!;
    if (!cust.phone && ord.customerPhone) cust.phone = ord.customerPhone;
    cust.orders.push(ord);
  }

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // 3. Compute CRM metrics & dynamic segmentation
  const crmProfiles = Array.from(customerMap.values()).map((cust) => {
    // Only count verified/paid or completed orders for spend & frequency
    const validOrders = cust.orders.filter((o) =>
      o.status === "paid" ||
      o.status === "kitchen_processing" ||
      o.status === "out_for_delivery" ||
      o.status === "completed"
    );

    const totalOrders = validOrders.length;
    const totalSpent = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const orderDates = validOrders.map((o) => o.createdAt || 0);
    const lastOrderDate = orderDates.length > 0 ? Math.max(...orderDates) : null;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

    // Segment classification
    let segment: "New Customer" | "Repeat Customer" | "Loyal Customer" | "Inactive Customer" = "New Customer";

    if (totalOrders >= 5 || totalSpent >= 500000) {
      segment = "Loyal Customer";
    } else if (totalOrders >= 2) {
      if (lastOrderDate && (now - lastOrderDate > thirtyDaysMs)) {
        segment = "Inactive Customer";
      } else {
        segment = "Repeat Customer";
      }
    } else if (totalOrders === 1) {
      if (lastOrderDate && (now - lastOrderDate > 45 * 24 * 60 * 60 * 1000)) {
        segment = "Inactive Customer";
      } else {
        segment = "New Customer";
      }
    } else {
      // 0 completed orders
      segment = "New Customer";
    }

    // Check if retention voucher sent
    const retentionSent = memoryRetentionActions.some(
      (r) => r.customerEmail.toLowerCase() === cust.email.toLowerCase()
    );

    return {
      email: cust.email,
      name: cust.name,
      phone: cust.phone,
      registeredAt: cust.registeredAt,
      totalOrders,
      totalSpent,
      lastOrderDate,
      averageOrderValue,
      segment,
      recentOrders: cust.orders.slice(0, 5),
      retentionActionSent: retentionSent,
    };
  });

  crmProfiles.sort((a, b) => b.totalSpent - a.totalSpent || (b.lastOrderDate || 0) - (a.lastOrderDate || 0));

  return c.json(crmProfiles);
});

// 12i. Admin Send Retention Campaign / Voucher to Customer
app.post("/api/admin/crm/retention", async (c) => {
  const { customerEmail, customerName, actionType, promoCode, notes } = await c.req.json<{
    customerEmail: string;
    customerName?: string;
    actionType: string;
    promoCode: string;
    notes?: string;
  }>();

  if (!customerEmail || !promoCode) {
    return c.json({ error: "Email pelanggan dan kode voucher wajib diisi" }, 400);
  }

  const actionRecord = {
    id: `ret_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    customerEmail: customerEmail.toLowerCase().trim(),
    customerName: customerName || "Pelanggan",
    actionType: actionType || "loyalty_voucher",
    promoCode: promoCode.toUpperCase().trim(),
    notes: notes || "Tindakan retensi otomatis dari panel CRM",
    status: "sent",
    createdAt: Date.now(),
  };

  memoryRetentionActions.unshift(actionRecord);

  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      await db.insert(schema.customerRetentionActions).values(actionRecord).catch(() => {});
    } catch (e) {}
  }

  return c.json({
    success: true,
    message: `Voucher retensi [${actionRecord.promoCode}] berhasil dikirim ke ${customerEmail}!`,
    action: actionRecord,
  });
});

app.get("/api/admin/crm/retention-logs", async (c) => {
  if (c.env?.DB) {
    try {
      const db = drizzle(c.env.DB, { schema });
      const logs = await db.select().from(schema.customerRetentionActions).orderBy(desc(schema.customerRetentionActions.createdAt)).all();
      if (logs && logs.length > 0) return c.json(logs);
    } catch (e) {}
  }
  return c.json(memoryRetentionActions);
});

// 12j. Business Model Canvas & Strategic Plan Data
app.get("/api/business-plan", (c) => {
  return c.json({
    brand: "SweetLayers Dessert Box Jakarta",
    tagline: "Lumer di Setiap Lapis, Manis yang Bikin Bahagia",
    domain: "https://ecommerce.sweetlayers.my.id",
    businessModelCanvas: {
      keyPartners: [
        "Supplier Kakao & Dark Chocolate Belgia (Callebaut importir)",
        "Petani Stroberi Lokal Lembang & Ciwidey (Grade A Super Fresh)",
        "Midtrans Payment Gateway (QRIS, VA Bank Mandiri, BCA, BNI, BRI)",
        "Logistik Kurir Instan (GoSend & GrabExpress Sameday/Instant Jabodetabek)",
        "Produsen Packaging Food-Grade (Hardbox laminasi, ice gel pack pendingin)"
      ],
      keyActivities: [
        "Fresh daily baking dan formulasi resep mousse multi-layer",
        "Quality control ketat & penyimpanan suhu rantai dingin (chiller 2-6°C)",
        "Perakitan hampers eksklusif dengan kartu ucapan kustom & pita satin",
        "Pengembangan platform e-commerce edge serverless berkecepatan tinggi",
        "Customer retention, program loyalty & CRM otomatis"
      ],
      keyResources: [
        "Dapur produksi steril bersertifikasi higienis",
        "Infrastruktur Cloudflare Pages + Edge Serverless + D1 Distributed Database",
        "Aset resep artisan pastry chef berpengalaman",
        "Armada packaging pendingin berinsulasi es gel"
      ],
      valuePropositions: [
        "100% Cokelat Belgia & Keju Mascarpone Otentik (Kaya rasa tanpa enek)",
        "Garansi Dingin Sampai Tempat (Packaging bersegel dengan ice gel pack)",
        "Pengiriman Super Cepat 1-2 Jam Se-Jabodetabek via kurir instan",
        "Custom Hamper & Gift Box siap kirim untuk kado ultah, wisuda & perayaan",
        "Checkout Otomatis Transparan dengan Midtrans QRIS & diskon promo real-time"
      ],
      customerRelationships: [
        "WhatsApp VIP Care & Konsultasi Hampers Ultah",
        "Customer Segmentation otomatis (New, Repeat, Loyal, Inactive)",
        "Loyalty Vouchers & Rekomendasi Reorder Berdasarkan Riwayat Belanja",
        "Garansi ganti baru jika produk rusak selama perjalanan"
      ],
      channels: [
        "Website Resmi E-Commerce (https://ecommerce.sweetlayers.my.id)",
        "Media Sosial (Instagram Reels & TikTok @sweetlayers.id)",
        "Direct Word-of-Mouth & Hampers Korporat Kantor",
        "Integrasi Pengiriman Google Maps & Geotargeting Jabodetabek"
      ],
      customerSegments: [
        "Sweet Tooth & Dessert Lovers usia 18-35 tahun di Jabodetabek",
        "Pemberi Kado & Hadiah (ulang tahun, anniversary, hampers Idul Fitri/Natal)",
        "Pekerja kantoran yang membutuhkan self-reward atau camilan sore rapat",
        "Keluarga muda yang menikmati sharing family dessert box"
      ],
      costStructure: [
        "Biaya Bahan Baku Premium (Belgian chocolate, butter, keju, buah) ~40%",
        "Packaging Eksklusif & Ice Gel Pendingin ~15%",
        "Operasional Dapur, Listrik Chiller & Tenaga Kerja ~18%",
        "Digital Marketing, Iklan & Diskon Promo Retensi ~12%",
        "Payment Gateway Fee (Midtrans QRIS 0.7%) & Cloud Hosting ~3%",
        "Target Margin Laba Bersih Operasional ~12%"
      ],
      revenueStreams: [
        "Penjualan Individual Dessert Box Personal (350ml)",
        "Penjualan Sharing Family Box (500ml)",
        "Penjualan Paket Hampers Mewah (Grand Festive Hamper 4-Box)",
        "Add-on Personalisasi (Lilin ultah, topper akrilik, kartu ucapan mewah)",
        "Biaya Pengiriman Kurir Instan / Sameday flat-rate"
      ]
    }
  });
});

// ==========================================
// PROXY SERVER MODULE
// ==========================================

// 13. Midtrans Transaction Status Proxy (Enforces backend-only Server Key & CORS-safe)
app.post("/api/proxy/midtrans/status", async (c) => {
  const { orderId } = await c.req.json<{ orderId: string }>();
  if (!orderId) {
    return c.json({ error: "Parameter orderId wajib disertakan" }, 400);
  }

  const serverKey =
    c.env?.MIDTRANS_SERVER_KEY || atob("TWlkLXNlcnZlci1lSl9WNEMxZE5JeHhyMkhQNmZ0cmgyV3Q=");
  const isProduction = c.env?.MIDTRANS_IS_PRODUCTION === "true";
  const auth = btoa(`${serverKey}:`);
  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  try {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
    });
    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (err: any) {
    return c.json({ error: err.message || "Gagal menghubungi Midtrans Proxy" }, 500);
  }
});

// 14. Midtrans Transaction Cancel Proxy (Admin Only)
app.post("/api/proxy/midtrans/cancel", async (c) => {
  const auth = await getAuthenticatedUser(c);
  if (!auth || auth.role !== "admin") {
    return c.json({ error: "Hanya akun Admin yang dapat membatalkan transaksi Midtrans" }, 403);
  }

  const { orderId } = await c.req.json<{ orderId: string }>();
  if (!orderId) {
    return c.json({ error: "Parameter orderId wajib disertakan" }, 400);
  }

  const serverKey =
    c.env?.MIDTRANS_SERVER_KEY || atob("TWlkLXNlcnZlci1lSl9WNEMxZE5JeHhyMkhQNmZ0cmgyV3Q=");
  const isProduction = c.env?.MIDTRANS_IS_PRODUCTION === "true";
  const basicAuth = btoa(`${serverKey}:`);
  const baseUrl = isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";

  try {
    const res = await fetch(`${baseUrl}/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
    });
    const data = await res.json();
    return c.json(data, res.status as any);
  } catch (err: any) {
    return c.json({ error: err.message || "Gagal menghubungi Midtrans Proxy" }, 500);
  }
});

// 15. General Safe Outbound Proxy (Routing external courier/logistics/webhook services)
app.post("/api/proxy/fetch", async (c) => {
  const { url, method = "GET", headers = {}, body } = await c.req.json<{
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }>();

  if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
    return c.json({ error: "URL yang valid (http/https) wajib disertakan" }, 400);
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
        "User-Agent": "SweetLayers-Proxy/1.0",
      },
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);
    const contentType = res.headers.get("content-type") || "";
    let responseData: any;
    if (contentType.includes("application/json")) {
      responseData = await res.json();
    } else {
      responseData = await res.text();
    }

    return c.json({
      status: res.status,
      statusText: res.statusText,
      data: responseData,
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Gagal melakukan proxy request" }, 500);
  }
});

export default app;
