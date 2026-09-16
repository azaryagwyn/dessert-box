import React from "react";
import { Plus, Eye } from "lucide-react";
import { Product } from "../types";
import { StockBadge } from "./StockBadge";

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.basePrice
      ? Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100)
      : null;

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all duration-300 flex flex-col justify-between">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-amber-50">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.badge && (
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              {product.badge}
            </span>
          )}
          {discountPercent && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              Hemat {discountPercent}%
            </span>
          )}
        </div>

        {/* Quick View Floating Button on Hover */}
        <button
          onClick={() => onSelectProduct(product)}
          className="absolute bottom-3 right-3 p-2.5 rounded-full bg-white/90 text-slate-800 backdrop-blur-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-white"
          title="Lihat Detail & Varian"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Stock Status */}
          <div className="mb-2">
            <StockBadge stock={product.totalStock} compact />
          </div>

          {/* Title & Short Description */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="font-['Playfair_Display',serif] font-bold text-lg text-slate-900 mb-1.5 group-hover:text-amber-700 transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
            {product.shortDesc}
          </p>
        </div>

        {/* Price and Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-slate-400">Mulai</span>
              <span className="font-extrabold text-base text-amber-900">
                Rp {product.basePrice.toLocaleString("id-ID")}
              </span>
            </div>
            {product.originalPrice && (
              <span className="text-[11px] text-slate-400 line-through">
                Rp {product.originalPrice.toLocaleString("id-ID")}
              </span>
            )}
          </div>

          <button
            onClick={() => onSelectProduct(product)}
            disabled={product.isOutOfStock}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              product.isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-amber-100/70 hover:bg-amber-500 text-amber-900 hover:text-white shadow-sm hover:shadow"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{product.isOutOfStock ? "Habis" : "Pilih Varian"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
