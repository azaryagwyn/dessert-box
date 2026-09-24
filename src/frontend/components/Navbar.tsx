import React, { useState, useRef, useEffect } from "react";
import {
  ShoppingBag,
  Sparkles,
  LayoutDashboard,
  Utensils,
  Heart,
  User as UserIcon,
  LogOut,
  PackageCheck,
  ChevronDown,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  onSelectCategory?: (slug: string) => void;
  onOpenOrders: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isAdminOpen,
  setIsAdminOpen,
  onOpenOrders,
}) => {
  const { totalItemCount, setIsCartOpen } = useCart();
  const { user, isAuthenticated, isAdmin, openLogin, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          <div className="flex items-center gap-2.5">
            {/* User Account / Login Button */}
            {isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition shadow-sm"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isAdmin ? "bg-purple-600" : "bg-pink-500"
                  }`}>
                    {isAdmin ? "👑" : user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block max-w-[100px] truncate">
                    <span className="block truncate font-bold text-gray-800">{user.name}</span>
                    <span className={`text-[10px] block leading-tight ${isAdmin ? "text-purple-600 font-semibold" : "text-gray-400"}`}>
                      {isAdmin ? "Administrator" : "Customer"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>

                    {!isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-gray-700 hover:bg-pink-50 hover:text-pink-600 flex items-center gap-2 transition"
                      >
                        <PackageCheck className="w-4 h-4 text-pink-500" />
                        <span>Riwayat Pesanan Saya</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsAdminOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 transition font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-purple-600" />
                        <span>Buka Panel Admin</span>
                      </button>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Masuk / Akun</span>
              </button>
            )}

            {/* Admin Toggle Button - Only visible for authenticated admin */}
            {isAdmin && (
              <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isAdminOpen
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                }`}
                title="Akses Panel Pengelola Toko"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">{isAdminOpen ? "Tutup Admin" : "Panel Admin"}</span>
              </button>
            )}

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
