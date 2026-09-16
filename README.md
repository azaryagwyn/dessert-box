# SweetLayers - Dessert Box E-Commerce Platform 🍰

Platform e-commerce modern khusus penjualan **Dessert Box**, dibangun dengan arsitektur **Cloudflare Ecosystem (Cloudflare Pages + Workers API + Cloudflare D1 SQLite)**, **Hono Framework**, **React 19 + Tailwind CSS**, dan terintegrasi dengan **Midtrans Payment Gateway (Snap API)**.

---

## 🌟 Fitur Utama

1. **Katalog & Pemilihan Varian Dessert Box**:
   - Menu dessert box aneka layer (Choco Lovers, Cheese & Creamy, Tiramisu, Fruity, Hampers).
   - Pilihan ukuran/varian per produk (*Personal Box 350ml*, *Large Sharing 500ml*, *Dessert Jar 250ml*, *Hampers Bundling*).
   - Catatan kustom untuk dapur (permintaan lilin, instruksi pengiriman, dll).
2. **Informasi & Kontrol Stok Real-Time**:
   - Status badge otomatis di setiap kartu produk dan varian:
     - `Ready Stock` (> 5 box)
     - `Sisa X box lagi!` (1 - 5 box, badge dengan animasi *pulse*)
     - `Habis (Sold Out)` (0 box, tombol dinonaktifkan otomatis).
   - Pencegahan over-order di backend secara otomatis.
   - Pengurangan stok seketika setelah pembayaran diverifikasi.
3. **Sistem Promosi & Diskon**:
   - Banner promo aktif & tiket kupon diskon di homepage (*1-click copy* kode voucher).
   - Validasi voucher promo di keranjang belanja (mendukung diskon persentase dan potongan nominal).
   - Tampilan harga coret (*strike-through*) dan label persentase hemat (*Hemat 18%*).
4. **Checkout Khusus Makanan / Pastry**:
   - Pilihan kurir: **Kurir Instan** (GoSend / GrabExpress), **Sameday Delivery**, atau **Ambil Sendiri di Outlet (Pick-up)**.
   - Pemilihan tanggal pengiriman dan slot jam tiba (Pagi, Siang, Sore).
   - Input kartu ucapan kustom gratis untuk kado/ulang tahun.
5. **Pembayaran Online (Payment Gateway)**:
   - Integrasi **Midtrans Snap**: mendukung **QRIS** (GoPay, OVO, ShopeePay, Dana, BCA) & **Virtual Account** (BCA, Mandiri, BRI).
   - Dilengkapi **Sandbox Payment Simulator** bawaan agar bisa diuji secara langsung tanpa hambatan.
   - Endpoint webhook `/api/payment/webhook` untuk update otomatis dari Midtrans.
6. **Panel Pengelola Toko / Admin Panel (Cloudflare D1)**:
   - Monitor total omset, jumlah pesanan, dan pesanan yang sedang diproses dapur.
   - **Quick Stock Editor**: Update jumlah stok varian dessert box secara instan ke database SQLite.
   - Manajemen status order (*Menunggu Bayar* &rarr; *Proses Dapur* &rarr; *Diantar Kurir* &rarr; *Selesai*).

---

## 🏗️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend API**: [Hono](https://hono.dev/) (dirancang natif untuk Cloudflare Workers / Pages Functions)
- **Database**: Cloudflare D1 (SQLite) dengan [Drizzle ORM](https://orm.drizzle.team/)
- **Payment Gateway**: Midtrans Snap API (QRIS & Virtual Account)
- **Deployment Platform**: Cloudflare Pages / Workers (`wrangler.toml`)

---

## 🚀 Menjalankan Project Secara Lokal

### 1. Masuk ke Direktori Project
```bash
cd dessert-box-ecommerce
```

### 2. Jalankan Development Server
```bash
npm run dev
```
Buka browser di: **`http://localhost:3000`**

Backend Hono dan Cloudflare D1 emulator (`local.sqlite`) langsung aktif dan terhubung otomatis dengan frontend Vite. Data seeder awal (aneka dessert box, varian, stok, dan voucher promo) akan terbuat otomatis pada startup pertama.

---

## ☁️ Deployment ke Cloudflare Pages & D1 Production

### 1. Buat Database D1 di Cloudflare
```bash
npx wrangler d1 create dessert-box-db
```
Salin `database_id` yang didapat ke dalam file `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "dessert-box-db"
database_id = "PASTE_DATABASE_ID_ANDA_DI_SINI"
```

### 2. Build & Deploy
```bash
npm run build
npx wrangler pages deploy dist
```

### 3. Konfigurasi Midtrans Production / Sandbox
Tambahkan Environment Variable di dashboard Cloudflare Pages atau via secrets:
- `MIDTRANS_SERVER_KEY`: Server Key dari Midtrans Dashboard
- `MIDTRANS_CLIENT_KEY`: Client Key dari Midtrans Dashboard
- `MIDTRANS_IS_PRODUCTION`: `"true"` (untuk live) atau `"false"` (untuk sandbox)

---

## 📁 Struktur Folder

```
dessert-box-ecommerce/
├── data/
│   └── local.sqlite            # Cloudflare D1 Local SQLite DB
├── src/
│   ├── backend/
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle ORM SQLite Schema
│   │   │   └── local-d1.ts     # Cloudflare D1 Emulator & Data Seeder
│   │   └── index.ts            # Hono Backend API (Restful, Checkout, Webhook, Admin)
│   └── frontend/
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── PromoBanner.tsx
│       │   ├── ProductCard.tsx
│       │   ├── ProductModal.tsx
│       │   ├── CartDrawer.tsx
│       │   ├── CheckoutModal.tsx
│       │   ├── OrderSuccessModal.tsx
│       │   ├── AdminPanel.tsx
│       │   └── StockBadge.tsx
│       ├── context/
│       │   └── CartContext.tsx # Shopping Cart & Voucher state
│       ├── types/
│       │   └── index.ts
│       ├── App.tsx
│       └── main.tsx
├── wrangler.toml               # Cloudflare Configuration
├── vite.config.ts              # Vite + Hono Cloudflare Middleware
└── package.json
```
# dessert-box
