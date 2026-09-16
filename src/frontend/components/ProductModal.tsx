import React, { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag, ThermometerSnowflake, Check } from "lucide-react";
import { Product, ProductVariant } from "../types";
import { StockBadge } from "./StockBadge";
import { useCart } from "../context/CartContext";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (product && product.variants.length > 0) {
      // Prioritize available in-stock variant
      const inStockVariant = product.variants.find((v) => v.stock > 0) || product.variants[0];
      setSelectedVariant(inStockVariant);
      setQuantity(1);
      setNotes("");
    }
  }, [product]);

  if (!product || !selectedVariant) return null;

  const currentPrice = product.basePrice + selectedVariant.additionalPrice;
  const totalPrice = currentPrice * quantity;
  const isVariantOutOfStock = selectedVariant.stock === 0;

  const handleAddToCart = () => {
    if (isVariantOutOfStock) return;

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      productName: product.name,
      variantName: selectedVariant.variantName,
      imageUrl: product.imageUrl,
      unitPrice: currentPrice,
      quantity,
      maxStock: selectedVariant.stock,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-orange-100 max-h-[90vh] flex flex-col">
        {/* Header / Close button */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-amber-50">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-slate-800 backdrop-blur-md shadow-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {product.badge && (
            <span className="absolute bottom-3 left-4 bg-slate-900/85 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
              {product.badge}
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Title and Description */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-bold text-slate-900">
                {product.name}
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{product.description}</p>

            {product.temperatureInfo && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-900 text-xs font-medium">
                <ThermometerSnowflake className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{product.temperatureInfo}</span>
              </div>
            )}
          </div>

          {/* Variant Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pilih Ukuran / Varian:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant.id === variant.id;
                const isOut = variant.stock === 0;
                const variantPrice = product.basePrice + variant.additionalPrice;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:border-amber-300 bg-white"
                    } ${isOut ? "opacity-60 bg-slate-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-bold text-xs text-slate-900">{variant.variantName}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-xs font-extrabold text-amber-900">
                        Rp {variantPrice.toLocaleString("id-ID")}
                      </span>
                      <StockBadge stock={variant.stock} compact />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Jumlah Pesanan:
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-2xl p-1 bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isVariantOutOfStock}
                    className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-sm text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedVariant.stock, q + 1))}
                    disabled={quantity >= selectedVariant.stock || isVariantOutOfStock}
                    className="p-2 rounded-xl bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">
                  Maks: <strong className="text-slate-800">{selectedVariant.stock}</strong> box
                </span>
              </div>
            </div>

            {/* Kitchen Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Catatan Dapur / Pesan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Tambah lilin, kirim dingin"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Footer with Price and Add to Cart */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Pembelian</span>
            <span className="text-xl font-extrabold text-amber-900">
              Rp {totalPrice.toLocaleString("id-ID")}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isVariantOutOfStock}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all ${
              isVariantOutOfStock
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg active:scale-95"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isVariantOutOfStock ? "Stok Varian Habis" : "Tambah ke Keranjang"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
