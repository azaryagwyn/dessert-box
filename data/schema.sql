-- Schema D1 Database untuk SweetLayers Dessert Box
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
  customer_id TEXT REFERENCES users(id),
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

-- Seed Categories
INSERT OR IGNORE INTO categories (id, name, slug, icon) VALUES
('cat_all', 'Semua Menu', 'all', '🍰'),
('cat_choco', 'Choco Lovers', 'choco-lovers', '🍫'),
('cat_cheese', 'Cheese & Creamy', 'cheese-creamy', '🧀'),
('cat_coffee', 'Coffee & Tiramisu', 'coffee-tiramisu', '☕'),
('cat_fruity', 'Fruity Fresh', 'fruity-fresh', '🍓'),
('cat_hampers', 'Hampers & Bundling', 'hampers-bundling', '🎁');

-- Seed Products
INSERT OR IGNORE INTO products (id, category_id, name, slug, description, short_desc, base_price, original_price, image_url, badge, temperature_info, is_active, created_at) VALUES
('p1', 'cat_choco', 'Belgian Dark Choco Melt Box', 'belgian-dark-choco-melt', 'Lapisan sponge cake cokelat lembut berpadu dengan chocolate mousse premium asal Belgia, ganache dark chocolate leleh, dan taburan choco chips krispi.', 'Dark chocolate mousse Belgia dengan melted ganache', 48000, 58000, '/images/products/belgian-dark-choco.jpg', 'Best Seller 🔥', 'Simpan chiller (suhu 2-6°C). Tahan 4-5 hari.', 1, 1726500000000),
('p2', 'cat_coffee', 'Classic Venetian Tiramisu Box', 'classic-venetian-tiramisu', 'Tiramisu otentik dengan ladyfingers yang dicelupkan ke dalam single-origin espresso aromatik, dilapisi krim keju mascarpone lembut dan taburan bubuk kakao murni.', 'Espresso dipped ladyfingers & mascarpone cheese lembut', 52000, 62000, '/images/products/classic-venetian-tiramisu.jpg', 'Chef Choice ⭐', 'Simpan chiller. Nikmati selagi dingin untuk sensasi melt-in-mouth.', 1, 1726500000000),
('p3', 'cat_cheese', 'Lotus Biscoff Caramel Velvet', 'lotus-biscoff-caramel-velvet', 'Perpaduan biskuit Lotus Biscoff renyah di dasar box, disiram cream cheese mousse vanilla, saus selai Biscoff karamel lumer, dan topping biskuit utuh di atasnya.', 'Cream cheese lembut dipadu lelehan spread Lotus Biscoff', 49000, 55000, '/images/products/lotus-biscoff-caramel-velvet.jpg', 'Favorit 💖', 'Tahan 5 hari dalam kulkas, 2 minggu dalam freezer.', 1, 1726500000000),
('p4', 'cat_cheese', 'Matcha Basque Cream Cheese', 'matcha-basque-cream-cheese', 'Menggunakan bubuk Uji Matcha asli Jepang dengan aftertaste umami yang khas, dipadukan keju basque yang dipanggang sempurna.', 'Uji Matcha autentik berpadu keju bakar creamy', 54000, NULL, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80', 'Signature 🍵', 'Sajikan dingin langsung dari kulkas.', 1, 1726500000000),
('p5', 'cat_fruity', 'Fresh Strawberry Shortcake Box', 'fresh-strawberry-shortcake', 'Vanilla sponge selembut awan dilapisi chantilly cream ringan dan potongan buah stroberi segar lokal yang manis-segar.', 'Potongan stroberi segar & fresh vanilla chantilly cream', 46000, 52000, '/images/products/fresh-strawberry-shortcake.jpg', 'Segar & Manis 🍓', 'Sangat disarankan langsung dihabiskan dalam 2 hari.', 1, 1726500000000),
('p6', 'cat_fruity', 'Mango Coconut Sago Jar', 'mango-coconut-sago-jar', 'Dessert jar menyegarkan dengan lapisan puree mangga harum manis asli, sagu mutiara lembut, santan kelapa creamy, dan nata de coco kenyal di dalam jar kaca cantik.', 'Puree mangga manis harum dengan mutiara sagu & kelapa', 38000, NULL, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80', 'Refreshing 🥭', 'Kocok perlahan sebelum dinikmati dingin.', 1, 1726500000000),
('p7', 'cat_cheese', 'Red Velvet Dream Cheese Box', 'red-velvet-dream-cheese', 'Kue Red Velvet lembab bertabur red velvet crumbs renyah, berpadu dengan frosting cream cheese asam-manis segar yang pas di lidah.', 'Moist red velvet cake dengan frosting cream cheese segar', 47000, NULL, 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=600&q=80', 'Classic 🍰', 'Tahan 4 hari di chiller.', 1, 1726500000000),
('p8', 'cat_hampers', 'Grand Festive Hamper (Isi 4 Box)', 'grand-festive-hamper-4-box', 'Paket hampers eksklusif berisi 4 dessert box favorit (Belgian Choco, Tiramisu, Biscoff, dan Red Velvet), dikemas dengan Hardbox mewah, pita satin, sendok kayu, lilin, dan kartu ucapan kustom.', 'Paket 4 box terfavorit + Box Mewah + Kartu Ucapan', 185000, 215000, '/images/products/grand-festive-hamper.jpg', 'Diskon Bundling 🎁', 'Bisa pilih pengiriman instan untuk hadiah ulang tahun/kejutan.', 1, 1726500000000);

-- Seed Variants
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, additional_price, stock, sku) VALUES
('v1_1', 'p1', 'Personal Box (350ml)', 0, 15, 'DB-CHOCO-350'),
('v1_2', 'p1', 'Sharing Family Box (500ml)', 20000, 8, 'DB-CHOCO-500'),
('v2_1', 'p2', 'Personal Box (350ml)', 0, 12, 'DB-TIRA-350'),
('v2_2', 'p2', 'Dessert Jar Kaca (250ml)', -10000, 8, 'DB-TIRA-JAR'),
('v3_1', 'p3', 'Personal Box (350ml)', 0, 14, 'DB-BISC-350'),
('v3_2', 'p3', 'Sharing Family Box (500ml)', 22000, 5, 'DB-BISC-500'),
('v4_1', 'p4', 'Personal Box (350ml)', 0, 9, 'DB-MATCHA-350'),
('v4_2', 'p4', 'Mini Cup Bento (200ml)', -14000, 16, 'DB-MATCHA-200'),
('v5_1', 'p5', 'Personal Box (350ml)', 0, 4, 'DB-STRAW-350'),
('v5_2', 'p5', 'Sharing Family Box (500ml)', 20000, 0, 'DB-STRAW-500'),
('v6_1', 'p6', 'Single Glass Jar (300ml)', 0, 18, 'DB-MANGO-300'),
('v6_2', 'p6', 'Twin Jar Duo (2 x 300ml)', 32000, 8, 'DB-MANGO-DUO'),
('v7_1', 'p7', 'Personal Box (350ml)', 0, 12, 'DB-REDV-350'),
('v7_2', 'p7', 'Sharing Family Box (500ml)', 20000, 6, 'DB-REDV-500'),
('v8_1', 'p8', 'Standard Hamper Box + Pita', 0, 7, 'DB-HAMP-STD'),
('v8_2', 'p8', 'Deluxe Hamper + Lilin & Akrilik Topper', 25000, 4, 'DB-HAMP-DLX');

-- Seed Promotions
INSERT OR IGNORE INTO promotions (id, code, title, description, discount_type, discount_value, min_purchase, max_discount, quota, used_count, banner_image_url, is_banner, is_active) VALUES
('pr1', 'MANIS20', 'Diskon 20% Pengguna Baru', 'Dapatkan potongan 20% (maksimal Rp 25.000) untuk pesanan pertamamu!', 'percentage', 20, 50000, 25000, 200, 0, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80', 1, 1),
('pr2', 'DESSERT10K', 'Potongan Rp 10.000 Weekend Treat', 'Potongan langsung Rp 10.000 dengan minimal belanja Rp 75.000.', 'fixed', 10000, 75000, 10000, 100, 0, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80', 1, 1),
('pr3', 'ONGKIRHEMAT', 'Gratis / Subsidi Ongkir Rp 15.000', 'Subsidi ongkir kurir instan/sameday Rp 15.000 dengan minimal order Rp 90.000.', 'fixed', 15000, 90000, 15000, 150, 0, NULL, 0, 1);

-- Seed Initial Admin User
INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, created_at) VALUES
('usr_admin_1', 'Admin SweetLayers', 'admin@sweetlayers.com', '081234567890', '02f34e4e6b5351afc6ab1163a31aca891937556501c12323ff77d72dbe537543', 'admin', 1726500000000);
