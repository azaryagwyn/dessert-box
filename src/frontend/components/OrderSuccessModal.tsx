import React from "react";
import { CheckCircle, Calendar, Clock, MapPin, MessageCircle, HeartHandshake, X } from "lucide-react";
import { Order } from "../types";

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const whatsappMessage = encodeURIComponent(
    `Halo SweetLayers! Saya ingin konfirmasi pesanan dengan nomor order: ${order.orderNumber} atas nama ${order.customerName}. Terima kasih!`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-orange-100 flex flex-col">
        {/* Top Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>

          <h2 className="font-['Playfair_Display',serif] text-2xl font-bold">
            Pembayaran Berhasil!
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            Pesanan Anda telah kami terima dan langsung dipersiapkan oleh tim dapur SweetLayers.
          </p>
        </div>

        {/* Order Details Body */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Order Reference Box */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Nomor Pesanan:
              </span>
              <span className="font-mono text-base font-black text-amber-900">
                {order.orderNumber}
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Lunas & Terverifikasi
            </span>
          </div>

          {/* Delivery Details */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900 border-b border-slate-200 pb-2">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              <span>Detail Penerima: {order.customerName} ({order.customerPhone})</span>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>Jadwal Pengiriman: <strong>{order.deliveryDate || "Hari ini"}</strong></span>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>Slot Waktu: <strong>{order.deliveryTimeSlot || "Sesuai konfirmasi"}</strong></span>
            </div>

            {order.deliveryAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2">Alamat: {order.deliveryAddress}</span>
              </div>
            )}

            {order.greetingCardText && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] italic">
                💌 <strong>Kartu Ucapan:</strong> "{order.greetingCardText}"
              </div>
            )}
          </div>

          {/* Items Summary */}
          {order.items && order.items.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Menu yang Dipesan:
              </h4>
              <div className="space-y-1.5">
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{it.productName}</span>
                      <span className="text-slate-500 ml-1">({it.variantName}) x{it.quantity}</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      Rp {it.subtotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Paid */}
          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Total Dibayar ({order.paymentMethod}):</span>
            <span className="text-lg font-black text-amber-900">
              Rp {order.totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
          <a
            href={`https://wa.me/6281234567890?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat WhatsApp Toko</span>
          </a>

          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all"
          >
            Selesai / Pesan Lagi
          </button>
        </div>
      </div>
    </div>
  );
};
