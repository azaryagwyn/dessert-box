import React, { useState } from "react";
import { Tag, Copy, Check, TicketPercent, ArrowRight } from "lucide-react";
import { Promotion } from "../types";
import { useCart } from "../context/CartContext";

interface PromoBannerProps {
  promotions: Promotion[];
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ promotions }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { applyPromo, setIsCartOpen } = useCart();

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApplyPromoDirectly = async (code: string) => {
    await applyPromo(code);
    setIsCartOpen(true);
  };

  if (promotions.length === 0) return null;

  return (
    <section id="promo-section" className="py-6 bg-gradient-to-b from-amber-50/50 to-orange-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <TicketPercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900">
                Promo & Voucher Hari Ini
              </h2>
              <p className="text-xs text-slate-500">Salin kode atau klik klaim untuk dapatkan potongan harga langsung</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-100/70 text-amber-800 rounded-full w-fit">
            Terbatas Hari Ini
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="relative overflow-hidden rounded-2xl bg-white border border-amber-100/80 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Decorative cutout for ticket look */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FFFDFB] rounded-full border-r border-amber-100" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#FFFDFB] rounded-full border-l border-amber-100" />

              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                    <Tag className="w-3 h-3" />
                    {promo.discountType === "percentage" ? `Diskon ${promo.discountValue}%` : `Potongan Rp ${(promo.discountValue / 1000)}k`}
                  </span>
                  <span className="text-[11px] text-slate-400">Min. order Rp {(promo.minPurchase / 1000)}k</span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-1">{promo.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{promo.description}</p>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <span className="font-mono font-bold text-xs text-amber-800 tracking-wider">{promo.code}</span>
                  <button
                    onClick={() => handleCopy(promo.code)}
                    className="text-amber-700 hover:text-amber-900 transition-colors p-0.5"
                    title="Salin Kode Voucher"
                  >
                    {copiedCode === promo.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => handleApplyPromoDirectly(promo.code)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors group"
                >
                  <span>Pakai Kupon</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
