import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Heart,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { PromoBanner } from "./components/PromoBanner";
import { ProductCard } from "./components/ProductCard";
import { ProductModal } from "./components/ProductModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { OrderSuccessModal } from "./components/OrderSuccessModal";
import { AdminPanel } from "./components/AdminPanel";
import { CartProvider } from "./context/CartContext";
import { Category, Product, Promotion, Order } from "./types";

export function DessertBoxApp() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [catsRes, prodsRes, promosRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/promotions"),
      ]);

      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (promosRes.ok) setPromotions(await promosRes.json());
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Navbar */}
      <Navbar isAdminOpen={isAdminOpen} setIsAdminOpen={setIsAdminOpen} />

      <main className="flex-1">
        {/* Admin Management Dashboard (Toggled) */}
        {isAdminOpen && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AdminPanel
              onClose={() => setIsAdminOpen(false)}
              onRefreshData={() => fetchData()}
            />
          </div>
        )}

        {/* Hero Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-100/50 via-orange-50/30 to-[#FFFDFB] pt-8 pb-16">
          {/* Subtle background blob */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Copywriting */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200 shadow-xs text-xs font-bold text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Artisan Dessert Box Premium #1 di Kotamu</span>
                </div>

                <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
                  Lumer di Setiap Lapis, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600">
                    Manis yang Bikin Bahagia.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                  Dibuat segar setiap hari dengan 100% dark chocolate Belgia, keju mascarpone impor, dan buah segar pilihan. Siap dikirim instan untuk memanjakan harimu atau kejutan kado orang tersayang!
                </p>

                {/* Badges / Guarantees */}
                <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                  <div className="p-3 rounded-2xl bg-white/80 border border-orange-100/80 shadow-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">100% Halal & Higienis</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/80 border border-orange-100/80 shadow-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">Fresh Daily Baked</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/80 border border-orange-100/80 shadow-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800">Garansi Dingin Sampai</span>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#menu-catalog"
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>Pilih Dessert Box Sekarang</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>

                  <a
                    href="#promo-section"
                    className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm transition-all"
                  >
                    Klaim Voucher Diskon
                  </a>
                </div>
              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md">
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-amber-100 relative group">
                    <img
                      src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80"
                      alt="Belgian Dark Choco Melt Box"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white inline-block mb-1">
                        Best Seller 🔥
                      </span>
                      <h3 className="font-['Playfair_Display',serif] text-lg font-bold">
                        Belgian Dark Chocolate Melt
                      </h3>
                      <p className="text-xs text-white/90">Sensasi ganache lumer yang tak terlupakan</p>
                    </div>
                  </div>

                  {/* Floating Customer Stat Card */}
                  <div className="absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-orange-100 shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: "3s" }}>
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-lg">
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">4.9/5.0 Rating</span>
                      <span className="text-[10px] text-slate-500">&gt;12.500 Box Terkirim Puas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Promotions and Coupons Section */}
        <PromoBanner promotions={promotions} />

        {/* Product Catalog Section */}
        <section id="menu-catalog" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 block mb-1">
                Katalog Menu Favorit
              </span>
              <h2 className="font-['Playfair_Display',serif] text-3xl font-extrabold text-slate-900">
                Pilih Dessert Box Sesuai Moodmu
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari rasa atau varian dessert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-amber-500 shadow-xs"
              />
            </div>
          </div>

          {/* Categories Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-102"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
              <span className="text-4xl mb-3 block">🔍</span>
              <h3 className="font-bold text-slate-800 text-lg mb-1">Dessert Box Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Coba ubah kata kunci pencarian atau pilih kategori menu lain di atas.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs"
              >
                Tampilkan Semua Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Why Choose Us Section */}
        <section id="why-sweetlayers" className="py-16 bg-amber-50/40 border-y border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 block mb-1">
                Kualitas Tanpa Kompromi
              </span>
              <h2 className="font-['Playfair_Display',serif] text-3xl font-extrabold text-slate-900">
                Kenapa Harus SweetLayers?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
                  🍫
                </div>
                <h3 className="font-bold text-slate-900 text-base">Bahan Premium & Halal</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Kami hanya menggunakan chocolate couverture Belgia, cream cheese mascarpone asli, dan mentega impor tanpa pengawet buatan.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl font-bold">
                  ❄️
                </div>
                <h3 className="font-bold text-slate-900 text-base">Kemasan Thermal & Ice Gel</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Setiap pengiriman kurir dibekali tas thermal & ice gel khusus agar suhu dingin terjaga sempurna sampai di tangan Anda.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-orange-100 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold">
                  💳
                </div>
                <h3 className="font-bold text-slate-900 text-base">Bayar Online Instan</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Dukung QRIS, GoPay, OVO, ShopeePay, dan Virtual Account Bank dengan verifikasi otomatis tanpa perlu kirim struk manual!
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍰</span>
                <span className="font-['Playfair_Display',serif] text-xl font-bold text-white">
                  SweetLayers Dessert Box
                </span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
                Spesialis dessert box premium dengan aneka layer mousse lumer dan rasa otentik. Buka setiap hari untuk memuaskan selera manis Anda.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Jam Operasional</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                Senin - Minggu: 09:00 - 21:00 WIB<br />
                Pengiriman Instan: 10:00 - 19:00 WIB<br />
                Outlet: Jl. Manis No. 8, Dapur Pastry
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Layanan Pelanggan</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                WhatsApp: +62 812-3456-7890<br />
                Instagram: @sweetlayers.dessertbox<br />
                Payment Gateway: Midtrans Snap
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <span>&copy; {new Date().getFullYear()} SweetLayers Dessert Box. Powered by Cloudflare Pages, Workers & D1 SQLite.</span>
            <span>Made with ❤️ for dessert lovers</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setSuccessOrder(order);
          fetchData(); // Refresh stock in real time
        }}
      />

      <OrderSuccessModal
        order={successOrder}
        onClose={() => setSuccessOrder(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <DessertBoxApp />
    </CartProvider>
  );
}
