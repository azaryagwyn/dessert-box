import React from "react";
import { ShoppingBag, Sparkles, LayoutDashboard, Utensils, Heart } from "lucide-react";
import { useCart } from "../context/CartContext";

interface NavbarProps {
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  onSelectCategory?: (slug: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isAdminOpen, setIsAdminOpen }) => {
  const { totalItemCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm transition-all">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "4s" }} />
        <span>Freshly Baked Daily! Pesan sebelum jam 16:00 untuk Pengiriman Hari Ini (Instant & Sameday)</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <a href="#" className="flex items-center gap-2.5 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform">
                🍰
              </div>
              <div>
                <span className="font-['Playfair_Display',serif] text-2xl font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">
                  Sweet<span className="text-amber-600">Layers</span>
                </span>
                <span className="block text-[11px] font-semibold text-amber-700 uppercase tracking-widest">
                  Artisan Dessert Box
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <a href="#menu-catalog" className="hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-amber-500" />
              <span>Menu Dessert</span>
            </a>
            <a href="#promo-section" className="hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Voucher Promo</span>
            </a>
            <a href="#why-sweetlayers" className="hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Keunggulan Kami</span>
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Admin Toggle Button */}
            <button
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isAdminOpen
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title="Akses Panel Pengelola Toko"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isAdminOpen ? "Tutup Admin" : "Panel Admin"}</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 font-semibold text-sm"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Keranjang</span>
              {totalItemCount > 0 && (
                <span className="bg-white text-amber-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-inner">
                  {totalItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
