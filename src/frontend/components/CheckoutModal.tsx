import React, { useState, useEffect, useRef } from "react";
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
  RefreshCw,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Order } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, subtotal, discountAmount, appliedPromo, clearCart } = useCart();
  const { user, authFetch } = useAuth();

  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);
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
  const [isSimulatingPay, setIsSimulatingPay] = useState(false);
  const orderedItemsRef = useRef<any[]>([]);

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
      const res = await authFetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.id,
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

      if (!res.ok || !data.success) {
        setIsLoading(false);
        setErrorMessage(data.error || "Terjadi kesalahan saat memproses pesanan.");
        return;
      }

      // 1. Snapshot ordered items for receipt / order record
      const itemsSnapshot = items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        productName: it.name,
        variantName: it.variantName,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.unitPrice * it.quantity,
      }));
      orderedItemsRef.current = itemsSnapshot;

      // 2. Unconditionally AUTO-CLEAR shopping cart immediately upon order placement!
      clearCart();
      try {
        localStorage.removeItem("sweetlayers_cart");
        localStorage.removeItem("sweetlayers_promo");
        localStorage.setItem("sweetlayers_cart", "[]");
        window.dispatchEvent(new Event("cart_updated"));
      } catch (_) {}

      // Check order status helper
      let pollTimer: any = null;
      const checkOrderStatus = async (ordNum: string): Promise<boolean> => {
        try {
          const sRes = await fetch(`/api/payment/status/${ordNum}`);
          const sData = await sRes.json();
          if (sData.success && sData.status === "paid") {
            if (pollTimer) clearInterval(pollTimer);
            await handlePaymentSuccess(ordNum, sData.payment_type || "Midtrans Online");
            return true;
          }
        } catch (_) {}
        return false;
      };

      // Launch Midtrans Snap Popup directly
      const snap = (window as any).snap;

      if (snap && typeof snap.pay === "function") {
        try {
          if (typeof snap.hide === "function") {
            try { snap.hide(); } catch (_) {}
          }
          const staleIframe = document.getElementById("snap-midtrans");
          if (staleIframe) staleIframe.remove();
          const staleOverlay = document.getElementById("snap-overlay");
          if (staleOverlay) staleOverlay.remove();

          // Poll Midtrans status every 2.5 seconds while customer is completing payment
          pollTimer = setInterval(async () => {
            await checkOrderStatus(data.orderNumber);
          }, 2500);

          snap.pay(data.snapToken, {
            onSuccess: async (result: any) => {
              if (pollTimer) clearInterval(pollTimer);
              await handlePaymentSuccess(data.orderNumber, result?.payment_type || "Midtrans Snap Online");
            },
            onPending: async (result: any) => {
              if (pollTimer) clearInterval(pollTimer);
              await handlePaymentSuccess(data.orderNumber, result?.payment_type || "Midtrans Pending");
            },
            onError: () => {
              if (pollTimer) clearInterval(pollTimer);
              clearCart();
              setErrorMessage("Pembayaran dibatalkan atau gagal diproses oleh gateway.");
            },
            onClose: async () => {
              if (pollTimer) clearInterval(pollTimer);
              // Ensure cart is cleared unconditionally
              clearCart();
              try {
                localStorage.removeItem("sweetlayers_cart");
                localStorage.removeItem("sweetlayers_promo");
                localStorage.setItem("sweetlayers_cart", "[]");
                window.dispatchEvent(new Event("cart_updated"));
              } catch (_) {}
              // Auto-confirm order and show order confirmation modal
              await handlePaymentSuccess(data.orderNumber, "Midtrans Snap");
            },
          });
        } catch (snapErr: any) {
          console.warn("Midtrans Snap error:", snapErr);
          if (pollTimer) clearInterval(pollTimer);
          // If popup blocked, open Midtrans page in new window
          window.open(`https://app.sandbox.midtrans.com/snap/v4/redirection/${data.snapToken}`, "_blank");
        }
      } else {
        // Fallback: Open Midtrans Snap redirection page in new window
        window.open(`https://app.sandbox.midtrans.com/snap/v4/redirection/${data.snapToken}`, "_blank");
      }
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage("Gagal menghubungkan ke server: " + err.message);
    }
  };

  const handlePaymentSuccess = async (orderNumber: string, method: string = "QRIS Instant") => {
    setIsSimulatingPay(true);

    const itemsForOrder =
      orderedItemsRef.current.length > 0
        ? orderedItemsRef.current
        : items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            productName: it.name,
            variantName: it.variantName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            subtotal: it.unitPrice * it.quantity,
          }));

    const orderData = {
      orderNumber,
      customerId: user?.id || null,
      customerName,
      customerPhone,
      customerEmail: customerEmail || user?.email || "",
      deliveryMethod,
      deliveryAddress,
      deliveryDate,
      deliveryTimeSlot,
      greetingCardText,
      subtotal,
      discountAmount,
      shippingFee,
      totalAmount,
      promoCode: appliedPromo?.code || "",
      status: "paid",
      paymentMethod: method,
      createdAt: Date.now(),
      items: itemsForOrder,
    };

    let paidOrder: any = orderData;

    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, paymentMethod: method, orderData }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        paidOrder = data.order;
      }
    } catch (err) {
      console.warn("Payment confirmation warning:", err);
    } finally {
      setIsSimulatingPay(false);

      // 1. Unconditionally clear the shopping cart
      clearCart();
      try {
        localStorage.removeItem("sweetlayers_cart");
        localStorage.removeItem("sweetlayers_promo");
        localStorage.setItem("sweetlayers_cart", "[]");
        window.dispatchEvent(new Event("cart_updated"));
      } catch (_) {}

      // 2. Save order to persistent local storage for cross-isolate and admin sync
      try {
        const existingAll = JSON.parse(localStorage.getItem("sweetlayers_all_orders") || "[]");
        const filtered = Array.isArray(existingAll)
          ? existingAll.filter((o: any) => o.orderNumber !== paidOrder.orderNumber)
          : [];
        localStorage.setItem("sweetlayers_all_orders", JSON.stringify([paidOrder, ...filtered]));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }

      // 3. Close modal & trigger success popup
      onClose();
      onOrderSuccess(paidOrder);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in">
      {/* Main Checkout Form */}
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
    </div>
  );
};
