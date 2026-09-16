import React from "react";
import { AlertCircle, CheckCircle2, Flame, XCircle } from "lucide-react";

interface StockBadgeProps {
  stock: number;
  compact?: boolean;
}

export const StockBadge: React.FC<StockBadgeProps> = ({ stock, compact = false }) => {
  if (stock === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${
          compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs"
        }`}
      >
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        <span>Habis (Sold Out)</span>
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-pulse ${
          compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
        }`}
      >
        <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
        <span>Sisa {stock} box lagi!</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${
        compact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>Ready Stock ({stock} box)</span>
    </span>
  );
};
