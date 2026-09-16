import React, { useState } from "react";
import {
  X,
  CreditCard,
  Truck,
  MapPin,
  Calendar,
  Clock,
  MessageSquareHeart,
  QrCode,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { Order } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, subtotal, discountAmount, appliedPromo, clearCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"instant_courier" | "sameday" | "pickup">("instant_courier");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState("Siang (13:00 - 16:00)");
  const [greetingCardText, setGreetingCardText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simulated Payment Modal State (for seamless testing of payment gateway)
  const [simulationData, setSimulationData] = useState<{
    orderNumber: string;
    totalAmount: number;
    snapToken: string;
  } | null>(null);
  const [isSimulatingPay, setIsSimulatingPay] = useState(false);

  if (!isOpen) return null;

  const shippingFee = deliveryMethod === "instant_courier" ? 20000 : deliveryMethod === "sameday" ? 15000 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Nama lengkap dan nomor WhatsApp wajib diisi.");
      return;
    }

    if (deliveryMethod !== "pickup" && !deliveryAddress.trim()) {
      setErrorMessage("Alamat pengiriman wajib diisi untuk kurir instan / sameday.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          deliveryMethod,
          deliveryAddress,
          deliveryDate,
          deliveryTimeSlot,
          greetingCardText,
          promoCode: appliedPromo?.code,
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
          })),
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Terjadi kesalahan saat memproses pesanan.");
        return;
      }

      // Check if Midtrans Snap window object is available in browser
      const snap = (window as any).snap;
      if (snap && snap.pay && !data.snapToken.startsWith("SNAP-DEMO")) {
        snap.pay(data.snapToken, {
          onSuccess: async () => {
            await handlePaymentSuccess(data.orderNumber, "Midtrans Snap Online");
          },
          onPending: async () => {
            await handlePaymentSuccess(data.orderNumber, "Midtrans Pending");
          },
          onError: () => {
            setErrorMessage("Pembayaran gagal atau dibatalkan oleh pembeli.");
          },
          onClose: () => {
            // If user closed snap popup, let them test with the sandbox simulator
            setSimulationData({
              orderNumber: data.orderNumber,
              totalAmount: data.totalAmount,
              snapToken: data.snapToken,
            });
          },
        });
      } else {
        // Tampilkan Simulator Pembayaran Midtrans Snap (QRIS, VA BCA)
        setSimulationData({
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          snapToken: data.snapToken,
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Gagal menghubungkan ke server: " + err.message);
    }
  };

  const handlePaymentSuccess = async (orderNumber: string, method: string = "QRIS Instant") => {
    setIsSimulatingPay(true);
    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, paymentMethod: method }),
      });

      const data = await res.json();
      setIsSimulatingPay(false);

      if (data.success && data.order) {
        clearCart();
        setSimulationData(null);
        onClose();
        onOrderSuccess(data.order);
      }
    } catch (err) {
      setIsSimulatingPay(false);
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in">
      {/* Interactive Payment Gateway Simulator Modal (Popup) */}
      {simulationData ? (
        <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-orange-100 p-6 space-y-5 animate-scale-up">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2 text-2xl shadow-inner">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900">
              Midtrans Payment Gateway
            </h3>
            <p className="text-xs text-slate-500">
              No. Pesanan: <strong className="font-mono text-slate-800">{simulationData.orderNumber}</strong>
            </p>
          </div>

          {/* Amount Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs text-slate-500 block">Total Tagihan Pembayaran:</span>
            <span className="text-2xl font-black text-amber-900">
              Rp {simulationData.totalAmount.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Payment Options Preview */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📱</span>
                <span className="font-bold text-slate-800">QRIS (GoPay, OVO, ShopeePay, BCA)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">Verifikasi Otomatis</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🏦</span>
                <span className="font-bold text-slate-800">Virtual Account (BCA, Mandiri, BRI)</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600">Aktif 24 Jam</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
            💡 <strong>Mode Simulasi / Sandbox:</strong> Klik tombol di bawah untuk menyimulasikan pembeli telah sukses membayar via QRIS atau Virtual Account. Sistem akan langsung memverifikasi dan mengurangi stok box secara otomatis.
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handlePaymentSuccess(simulationData.orderNumber, "QRIS Instant")}
              disabled={isSimulatingPay}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSimulatingPay ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Pembayaran...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulasikan Pembayaran Sukses (QRIS)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setSimulationData(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Kembali & Ubah Pesanan
            </button>
          </div>
        </div>
      ) : (
        /* Main Checkout Form */
        <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-orange-100 max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-slate-900">
                  Pengiriman & Pembayaran
                </h2>
                <p className="text-xs text-slate-500">Lengkapi data agar pesanan dessert box dapat diantar tepat waktu</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleCheckoutSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1. Data Pemesan */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <span>1. Data Penerima</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jessica Angeline"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-semibold mb-1">Email (untuk bukti transaksi)</label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Metode Pengiriman */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <span>2. Metode Pengiriman</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: "instant_courier",
                    title: "Kurir Instan",
                    desc: "GrabExpress / GoSend (1-2 Jam)",
                    fee: 20000,
                    icon: "🚀",
                  },
                  {
                    id: "sameday",
                    title: "Sameday Delivery",
                    desc: "Tiba di hari yang sama (4-6 Jam)",
                    fee: 15000,
                    icon: "🛵",
                  },
                  {
                    id: "pickup",
                    title: "Ambil Sendiri",
                    desc: "Pick-up langsung di outlet dapur",
                    fee: 0,
                    icon: "🏬",
                  },
                ].map((m) => {
                  const isSelected = deliveryMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDeliveryMethod(m.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div>
                        <span className="text-lg mb-1 block">{m.icon}</span>
                        <h4 className="font-bold text-xs text-slate-900">{m.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{m.desc}</p>
                      </div>
                      <span className="text-xs font-extrabold text-amber-900 mt-2">
                        {m.fee === 0 ? "Gratis" : `Rp ${m.fee.toLocaleString("id-ID")}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {deliveryMethod !== "pickup" && (
                <div className="mt-3">
                  <label className="block text-xs text-slate-600 font-semibold mb-1">
                    Alamat Pengiriman Lengkap & Patokan *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Alamat jalan, nomor rumah/kantor, RT/RW, dan patokan pengiriman..."
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 3. Jadwal & Kartu Ucapan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tanggal Pengiriman</span>
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Slot Waktu Diantar</span>
                </label>
                <select
                  value={deliveryTimeSlot}
                  onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none bg-white"
                >
                  <option value="Pagi (10:00 - 12:00)">Pagi (10:00 - 12:00)</option>
                  <option value="Siang (13:00 - 16:00)">Siang (13:00 - 16:00)</option>
                  <option value="Sore (16:00 - 19:00)">Sore (16:00 - 19:00)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <MessageSquareHeart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tuliskan Kartu Ucapan (Gratis untuk Kado/Hadiah)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Happy Birthday Sarah! Semoga harimu semanis dessert box ini! Dari: Cindy"
                  value={greetingCardText}
                  onChange={(e) => setGreetingCardText(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. Rincian Pembayaran */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({items.length} item)</span>
                <span className="font-semibold text-slate-800">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Potongan Promo ({appliedPromo?.code})</span>
                  <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim ({deliveryMethod === "pickup" ? "Ambil Sendiri" : "Kurir"})</span>
                <span className="font-semibold text-slate-800">
                  {shippingFee === 0 ? "Gratis" : `Rp ${shippingFee.toLocaleString("id-ID")}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-amber-200/80">
                <span>Total Pembayaran</span>
                <span className="text-amber-900">Rp {finalTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Bayar Sekarang (Online Payment Gateway)</span>
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pembayaran aman terenkripsi melalui Midtrans Snap Gateway</span>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
