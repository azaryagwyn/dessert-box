import { DatabaseSync } from "node:sqlite";
import { DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, DEFAULT_VARIANTS, DEFAULT_PROMOTIONS, DEFAULT_USERS } from "./initial-data";

export function createLocalD1(dbPath: string = "./data/local.sqlite"): D1Database {
  const sqlite = new DatabaseSync(dbPath);

  // Buat tabel jika belum ada
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      short_desc TEXT NOT NULL,
      base_price INTEGER NOT NULL,
      original_price INTEGER,
      image_url TEXT NOT NULL,
      badge TEXT,
      temperature_info TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_name TEXT NOT NULL,
      additional_price INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      sku TEXT
    );

    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_purchase INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER,
      quota INTEGER NOT NULL DEFAULT 100,
      used_count INTEGER NOT NULL DEFAULT 0,
      banner_image_url TEXT,
      is_banner INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      delivery_method TEXT NOT NULL,
      delivery_address TEXT,
      delivery_date TEXT,
      delivery_time_slot TEXT,
      greeting_card_text TEXT,
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER NOT NULL DEFAULT 0,
      shipping_fee INTEGER NOT NULL DEFAULT 0,
      total_amount INTEGER NOT NULL,
      promo_code TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      snap_token TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      variant_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );
  `);

  try {
    sqlite.exec("ALTER TABLE orders ADD COLUMN customer_id TEXT;");
  } catch (_) {
    // Ignore if column already exists
  }

  // Cek apakah data awal user sudah ada
  try {
    const userCount = sqlite.prepare("SELECT count(*) as count FROM users").get() as any;
    if (!userCount || userCount.count === 0) {
      seedUsers(sqlite);
    }
  } catch (_) {}

  // Cek apakah data awal sudah ada
  const catCount = sqlite.prepare("SELECT count(*) as count FROM categories").get() as any;
  if (!catCount || catCount.count === 0) {
    seedDatabase(sqlite);
  } else {
    // Sinkronisasi foto produk baru jika masih menggunakan link dummy unsplash
    try {
      for (const p of DEFAULT_PRODUCTS) {
        sqlite.prepare("UPDATE products SET image_url = ? WHERE id = ? AND image_url LIKE '%unsplash%'").run(p.imageUrl, p.id);
      }
    } catch (_) {}
  }

  function createPreparedStatement(query: string, boundParams: any[] = []) {
    return {
      bind(...params: any[]) {
        return createPreparedStatement(query, params);
      },
      async all() {
        const stmt = sqlite.prepare(query);
        const results = stmt.all(...boundParams);
        return { results, success: true, meta: {} };
      },
      async run() {
        const stmt = sqlite.prepare(query);
        const info = stmt.run(...boundParams);
        return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
      },
      async get(col?: string) {
        const stmt = sqlite.prepare(query);
        const row = stmt.get(...boundParams);
        if (!row) return null;
        return col ? (row as any)[col] : row;
      },
      async first(col?: string) {
        const stmt = sqlite.prepare(query);
        const row = stmt.get(...boundParams);
        if (!row) return null;
        return col ? (row as any)[col] : row;
      },
      async raw() {
        const stmt = sqlite.prepare(query);
        const rows = stmt.all(...boundParams);
        return rows.map((r: any) => Object.values(r as Record<string, any>));
      },
    };
  }

  return {
    prepare(query: string) {
      return createPreparedStatement(query);
    },
    async batch(stmts: any[]) {
      const results = [];
      for (const s of stmts) {
        results.push(await s.all());
      }
      return results;
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 1, duration: 0 };
    },
    dump() {
      throw new Error("Not implemented");
    },
  } as unknown as D1Database;
}

function seedUsers(sqlite: DatabaseSync) {
  const insertUser = sqlite.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    "usr_admin_1",
    "Admin SweetLayers",
    "admin@sweetlayers.com",
    "081234567890",
    "02f34e4e6b5351afc6ab1163a31aca891937556501c12323ff77d72dbe537543", // AdminSweetLayers2026!
    "admin",
    1726500000000
  );
}

function seedDatabase(sqlite: DatabaseSync) {
  const now = Date.now();

  // Kategori
  const insertCategory = sqlite.prepare(`INSERT INTO categories (id, name, slug, icon) VALUES (?, ?, ?, ?)`);
  insertCategory.run("cat_all", "Semua Menu", "all", "🍰");
  insertCategory.run("cat_choco", "Choco Lovers", "choco-lovers", "🍫");
  insertCategory.run("cat_cheese", "Cheese & Creamy", "cheese-creamy", "🧀");
  insertCategory.run("cat_coffee", "Coffee & Tiramisu", "coffee-tiramisu", "☕");
  insertCategory.run("cat_fruity", "Fruity Fresh", "fruity-fresh", "🍓");
  insertCategory.run("cat_hampers", "Hampers & Bundling", "hampers-bundling", "🎁");

  // Produk
  const insertProduct = sqlite.prepare(`
    INSERT INTO products (id, category_id, name, slug, description, short_desc, base_price, original_price, image_url, badge, temperature_info, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  insertProduct.run(
    "p1",
    "cat_choco",
    "Belgian Dark Choco Melt Box",
    "belgian-dark-choco-melt",
    "Lapisan sponge cake cokelat lembut berpadu dengan chocolate mousse premium asal Belgia, ganache dark chocolate leleh, dan taburan choco chips krispi. Rasa cokelat kaya dan tidak bikin enek!",
    "Dark chocolate mousse Belgia dengan melted ganache",
    48000,
    58000,
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    "Best Seller 🔥",
    "Simpan chiller (suhu 2-6°C). Tahan 4-5 hari.",
    now
  );

  insertProduct.run(
    "p2",
    "cat_coffee",
    "Classic Venetian Tiramisu Box",
    "classic-venetian-tiramisu",
    "Tiramisu otentik dengan ladyfingers yang dicelupkan ke dalam single-origin espresso aromatik, dilapisi krim keju mascarpone lembut dan taburan bubuk kakao murni tanpa pemanis berlebih.",
    "Espresso dipped ladyfingers & mascarpone cheese lembut",
    52000,
    62000,
    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80",
    "Chef Choice ⭐",
    "Simpan chiller. Nikmati selagi dingin untuk sensasi melt-in-mouth.",
    now
  );

  insertProduct.run(
    "p3",
    "cat_cheese",
    "Lotus Biscoff Caramel Velvet",
    "lotus-biscoff-caramel-velvet",
    "Perpaduan biskuit Lotus Biscoff renyah di dasar box, disiram cream cheese mousse vanilla, saus selai Biscoff karamel lumer, dan topping biskuit utuh di atasnya.",
    "Cream cheese lembut dipadu lelehan spread Lotus Biscoff",
    49000,
    55000,
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80",
    "Favorit 💖",
    "Tahan 5 hari dalam kulkas, 2 minggu dalam freezer.",
    now
  );

  insertProduct.run(
    "p4",
    "cat_cheese",
    "Matcha Basque Cream Cheese",
    "matcha-basque-cream-cheese",
    "Menggunakan bubuk Uji Matcha asli Jepang dengan aftertaste umami yang khas, dipadukan keju basque yang dipanggang sempurna dengan tekstur tengah yang lembut meleleh.",
    "Uji Matcha autentik berpadu keju bakar creamy",
    54000,
    null,
    "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
    "Signature 🍵",
    "Sajikan dingin langsung dari kulkas.",
    now
  );

  insertProduct.run(
    "p5",
    "cat_fruity",
    "Fresh Strawberry Shortcake Box",
    "fresh-strawberry-shortcake",
    "Vanilla sponge selembut awan dilapisi chantilly cream ringan dan potongan buah stroberi segar lokal yang manis-segar, dihiasi selai stroberi buatan dapur kami sendiri.",
    "Potongan stroberi segar & fresh vanilla chantilly cream",
    46000,
    52000,
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80",
    "Segar & Manis 🍓",
    "Sangat disarankan langsung dihabiskan dalam 2 hari.",
    now
  );

  insertProduct.run(
    "p6",
    "cat_fruity",
    "Mango Coconut Sago Jar",
    "mango-coconut-sago-jar",
    "Dessert jar menyegarkan dengan lapisan puree mangga harum manis asli, sagu mutiara lembut, santan kelapa creamy, dan nata de coco kenyal di dalam jar kaca cantik.",
    "Puree mangga manis harum dengan mutiara sagu & kelapa",
    38000,
    null,
    "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80",
    "Refreshing 🥭",
    "Kocok perlahan sebelum dinikmati dingin.",
    now
  );

  insertProduct.run(
    "p7",
    "cat_cheese",
    "Red Velvet Dream Cheese Box",
    "red-velvet-dream-cheese",
    "Kue Red Velvet lembab bertabur red velvet crumbs renyah, berpadu dengan frosting cream cheese asam-manis segar yang pas di lidah.",
    "Moist red velvet cake dengan frosting cream cheese segar",
    47000,
    null,
    "https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80",
    "Classic 🍰",
    "Tahan 4 hari di chiller.",
    now
  );

  insertProduct.run(
    "p8",
    "cat_hampers",
    "Grand Festive Hamper (Isi 4 Box)",
    "grand-festive-hamper-4-box",
    "Paket hampers eksklusif berisi 4 dessert box favorit (Belgian Choco, Tiramisu, Biscoff, dan Red Velvet), dikemas dengan Hardbox mewah, pita satin, sendok kayu, lilin, dan kartu ucapan kustom.",
    "Paket 4 box terfavorit + Box Mewah + Kartu Ucapan",
    185000,
    215000,
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
    "Diskon Bundling 🎁",
    "Bisa pilih pengiriman instan untuk hadiah ulang tahun/kejutan.",
    now
  );

  // Varian Produk & Stok
  const insertVariant = sqlite.prepare(`
    INSERT INTO product_variants (id, product_id, variant_name, additional_price, stock, sku)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // p1 variants
  insertVariant.run("v1_1", "p1", "Personal Box (350ml)", 0, 14, "DB-CHOCO-350");
  insertVariant.run("v1_2", "p1", "Sharing Family Box (500ml)", 20000, 6, "DB-CHOCO-500");

  // p2 variants
  insertVariant.run("v2_1", "p2", "Personal Box (350ml)", 0, 10, "DB-TIRA-350");
  insertVariant.run("v2_2", "p2", "Dessert Jar Kaca (250ml)", -10000, 8, "DB-TIRA-JAR");

  // p3 variants
  insertVariant.run("v3_1", "p3", "Personal Box (350ml)", 0, 12, "DB-BISC-350");
  insertVariant.run("v3_2", "p3", "Sharing Family Box (500ml)", 22000, 3, "DB-BISC-500");

  // p4 variants
  insertVariant.run("v4_1", "p4", "Personal Box (350ml)", 0, 8, "DB-MATCHA-350");
  insertVariant.run("v4_2", "p4", "Mini Cup Bento (200ml)", -14000, 15, "DB-MATCHA-200");

  // p5 variants (dengan contoh varian stok terbatas & habis)
  insertVariant.run("v5_1", "p5", "Personal Box (350ml)", 0, 3, "DB-STRAW-350"); // Low stock
  insertVariant.run("v5_2", "p5", "Sharing Family Box (500ml)", 20000, 0, "DB-STRAW-500"); // Sold out

  // p6 variants
  insertVariant.run("v6_1", "p6", "Single Glass Jar (300ml)", 0, 16, "DB-MANGO-300");
  insertVariant.run("v6_2", "p6", "Twin Jar Duo (2 x 300ml)", 32000, 7, "DB-MANGO-DUO");

  // p7 variants
  insertVariant.run("v7_1", "p7", "Personal Box (350ml)", 0, 11, "DB-REDV-350");
  insertVariant.run("v7_2", "p7", "Sharing Family Box (500ml)", 20000, 5, "DB-REDV-500");

  // p8 variants
  insertVariant.run("v8_1", "p8", "Standard Hamper Box + Pita", 0, 7, "DB-HAMP-STD");
  insertVariant.run("v8_2", "p8", "Deluxe Hamper + Lilin & Akrilik Topper", 25000, 4, "DB-HAMP-DLX");

  // Promo dan Voucher
  const insertPromo = sqlite.prepare(`
    INSERT INTO promotions (id, code, title, description, discount_type, discount_value, min_purchase, max_discount, quota, used_count, banner_image_url, is_banner, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
  `);

  insertPromo.run(
    "pr1",
    "MANIS20",
    "Diskon 20% Pengguna Baru",
    "Dapatkan potongan 20% (maksimal Rp 25.000) untuk pesanan pertamamu!",
    "percentage",
    20,
    50000,
    25000,
    200,
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80",
    1
  );

  insertPromo.run(
    "pr2",
    "DESSERT10K",
    "Potongan Rp 10.000 Weekend Treat",
    "Potongan langsung Rp 10.000 dengan minimal belanja Rp 75.000.",
    "fixed",
    10000,
    75000,
    10000,
    100,
    "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
    1
  );

  insertPromo.run(
    "pr3",
    "ONGKIRHEMAT",
    "Gratis / Subsidi Ongkir Rp 15.000",
    "Subsidi ongkir kurir instan/sameday Rp 15.000 dengan minimal order Rp 90.000.",
    "fixed",
    15000,
    90000,
    15000,
    150,
    null,
    0
  );
}
