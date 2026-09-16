import React, { useState } from "react";
import { X, Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

interface CartDrawerProps {
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOpenCheckout }) => {
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    totalAmount,
    appliedPromo,
    applyPromo,
    removePromo,
  } = useCart();

  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;

    setIsApplying(true);
    setPromoMessage(null);

    const result = await applyPromo(promoCodeInput);
    setIsApplying(false);

    if (result.success) {
      setPromoMessage({ type: "success", text: result.message });
      setPromoCodeInput("");
    } else {
      setPromoMessage({ type: "error", text: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900">
                Keranjang Pesanan
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {items.length} item
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Items List */}
          <div className="p-5 overflow-y-auto flex-1 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl">
                  🧁
                </div>
                <h3 className="font-bold text-slate-800 text-base">Keranjang Anda Masih Kosong</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Pilih aneka dessert box favoritmu dari katalog kami dan nikmati manisnya harimu!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  Mulai Belanja
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.variantId} className="py-4 first:pt-0 last:pb-0 flex gap-3.5">
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-18 h-18 rounded-2xl object-cover border border-amber-100 bg-amber-50 shrink-0"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="inline-block text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1">
                        {item.variantName}
                      </span>
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-md">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-1">
                      <span className="text-xs font-bold text-slate-800">
                        Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 rounded-lg hover:bg-white text-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3.5">
              {/* Promo Code Input */}
              <div>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-800">{appliedPromo.code}</span>
                        <span className="text-emerald-700 ml-1.5 font-medium">
                          (-Rp {appliedPromo.discountAmount.toLocaleString("id-ID")})
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={removePromo}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Punya kode promo? (cth: MANIS20)"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplying}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isApplying ? "Cek..." : "Pakai"}
                    </button>
                  </form>
                )}

                {promoMessage && (
                  <p
                    className={`text-[11px] mt-1.5 font-medium ${
                      promoMessage.type === "success" ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal Pesanan</span>
                  <span className="font-semibold text-slate-800">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Diskon Promo</span>
                    <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Sementara</span>
                  <span className="text-amber-900">Rp {totalAmount.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onOpenCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all"
              >
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
