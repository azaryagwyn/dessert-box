import React, { useState, useEffect } from "react";
import {
  Search,
  Truck,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  Clock,
  MapPin,
  Calendar,
  MessageCircle,
  X,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Heart,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface OrderItem {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  greetingCardText?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  promoCode?: string;
  status: string;
  paymentMethod?: string;
  snapToken?: string;
  createdAt: number;
  items?: OrderItem[];
}

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderNumber?: string | null;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  initialOrderNumber,
}) => {
  const { user, authFetch } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState<string | null>(null);
  const [refreshingOrder, setRefreshingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (initialOrderNumber) {
      setSearchQuery(initialOrderNumber);
      handleTrackQuery(initialOrderNumber);
      return;
    }

    if (user) {
      fetchUserOrders();
    } else {
      loadLocalGuestOrders();
    }
  }, [isOpen, user, initialOrderNumber]);

  const loadLocalGuestOrders = () => {
    try {
      const raw = localStorage.getItem("sweetlayers_all_orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sorted = parsed.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setOrders(sorted.slice(0, 5));
        }
      }
    } catch (_) {}
  };

  const fetchUserOrders = async () => {
    setIsLoading(true);
    setSearchError(null);
    try {
      const res = await authFetch("/api/customer/orders");
      let serverOrders: any[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) serverOrders = data;
      }

      let localOrders: any[] = [];
      try {
        const raw = localStorage.getItem("sweetlayers_all_orders");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localOrders = parsed.filter(
              (o) =>
                (user && o.customerId && o.customerId === user.id) ||
                (user &&
                  o.customerEmail &&
                  user.email &&
                  o.customerEmail.toLowerCase() === user.email.toLowerCase())
            );
          }
        }
      } catch (_) {}

      const mergedMap = new Map<string, any>();
      for (const o of serverOrders) {
        if (o && o.orderNumber) mergedMap.set(o.orderNumber, o);
      }
      for (const o of localOrders) {
        if (o && o.orderNumber && !mergedMap.has(o.orderNumber)) {
          mergedMap.set(o.orderNumber, o);
        }
      }

      const finalOrders = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );

      setOrders(finalOrders);
    } catch (err) {
      console.error("Gagal memuat riwayat pesanan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackQuery = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      setSearchError("Silakan ketik nomor pesanan (cth: DB-261116-1884) atau email Anda.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // 1. Try public track endpoint
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }

      // 2. Try direct order number endpoint
      const singleRes = await fetch(`/api/orders/${encodeURIComponent(q.toUpperCase())}`);
      if (singleRes.ok) {
        const singleData = await singleRes.json();
        if (singleData && singleData.orderNumber) {
          setOrders([singleData]);
          return;
        }
      }

      // 3. Check localStorage
      const raw = localStorage.getItem("sweetlayers_all_orders");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const matched = parsed.filter(
            (o) =>
              (o.orderNumber && o.orderNumber.toUpperCase() === q.toUpperCase()) ||
              (o.customerEmail && o.customerEmail.toLowerCase() === q.toLowerCase()) ||
              (o.customerPhone && o.customerPhone === q)
          );
          if (matched.length > 0) {
            setOrders(matched);
            return;
          }
        }
      }

      setSearchError(`Pesanan dengan kata kunci "${q}" tidak ditemukan. Pastikan nomor pesanan atau email sudah benar ya!`);
    } catch (err: any) {
      setSearchError("Gagal menghubungi server pelacakan. Silakan coba sesaat lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefreshSingleOrder = async (orderNumber: string) => {
    setRefreshingOrder(orderNumber);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}`);
      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.orderNumber === orderNumber ? { ...o, ...updated } : o))
        );
      }
    } catch (_) {
    } finally {
      setRefreshingOrder(null);
    }
  };

  const handleCopyOrderNumber = (orderNum: string) => {
    navigator.clipboard.writeText(orderNum);
    setCopiedOrderNumber(orderNum);
    setTimeout(() => setCopiedOrderNumber(null), 2000);
  };

  if (!isOpen) return null;

  const TRACKING_STEPS = [
    {
      key: "paid",
      title: "Pesanan Diterima",
      customerNote: "Pembayaran terverifikasi dan pesanan siap diproses",
      icon: CheckCircle2,
    },
    {
      key: "kitchen_processing",
      title: "Dipersiapkan Dapur",
      customerNote: "Koki kami sedang meracik dessert box pesananmu",
      icon: ChefHat,
    },
    {
      key: "out_for_delivery",
      title: "Dalam Perjalanan",
      customerNote: "Kurir sedang meluncur mengantarkan pesanan ke rumahmu",
      icon: Truck,
    },
    {
      key: "completed",
      title: "Telah Sampai",
      customerNote: "Pesanan tiba dengan selamat! Selamat menikmati 🍰",
      icon: PackageCheck,
    },
  ];

  const getStepProgressIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "paid":
        return 1;
      case "kitchen_processing":
        return 2;
      case "out_for_delivery":
        return 3;
      case "completed":
        return 4;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Pesanan Diterima
          </span>
        );
      case "kitchen_processing":
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <ChefHat className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            Sedang Dibuat di Dapur
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            Kurir Sedang Mengantar
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Pesanan Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold rounded-full flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
            Pesanan Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
            Menunggu Pembayaran
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-amber-950/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-[#FFFDF9] w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100/90">
        
        {/* Customer Header - Warm & Sweet Bakery Aesthetic */}
        <div className="p-6 sm:p-7 border-b border-amber-100 bg-gradient-to-br from-amber-50 via-rose-50/60 to-orange-50/40 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 border border-amber-100 shadow-2xs transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 text-white flex items-center justify-center text-2xl shadow-md">
              🍰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  Live Order Tracker
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> SweetLayers
                </span>
              </div>
              <h2 className="font-['Playfair_Display',serif] font-bold text-2xl text-slate-900 tracking-tight mt-1">
                Lacak Pesanan Manismu
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Lihat tahapan koki kami meracik dessert box hingga diantar kurir ke depan pintumu
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar for Customer */}
        <div className="p-4 sm:p-5 bg-white border-b border-amber-100/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackQuery();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Nomor Pesanan (cth: DB-261116-1884) atau Email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSearching}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-500 hover:from-amber-700 hover:to-rose-600 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Lacak Sekarang</span>
                  </>
                )}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={fetchUserOrders}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs rounded-2xl transition flex items-center gap-1"
                  title="Lihat semua pesanan akun saya"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Pesanan Saya</span>
                </button>
              )}
            </div>
          </form>

          {searchError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Orders Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FAF7F2]/40">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <span className="font-medium text-slate-600">Sedang memeriksa status pesanan dessert Anda...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-100/70 border border-amber-200 text-amber-700 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                📦
              </div>
              <h3 className="font-['Playfair_Display',serif] font-bold text-slate-800 text-lg">
                Temukan Pesanan Dessert Anda
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Silakan masukkan nomor pesanan Anda yang tertera pada faktur atau email pemesanan untuk melihat perjalanan dessert Anda.
              </p>
            </div>
          ) : (
            orders.map((ord) => {
              const currentStep = getStepProgressIndex(ord.status);
              const isCancelled = ord.status === "cancelled";
              const isPending = ord.status === "pending";

              const whatsappMessage = encodeURIComponent(
                `Halo Kak SweetLayers! Saya ingin menanyakan status pesanan saya #${ord.orderNumber} atas nama ${ord.customerName}. Terima kasih!`
              );

              return (
                <div
                  key={ord.id || ord.orderNumber}
                  className="bg-white border border-amber-100 rounded-3xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                >
                  {/* Top Bar: Order ID, Time, and Live Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/80 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">NO. PESANAN:</span>
                        <span className="text-sm font-mono font-black text-amber-950">
                          #{ord.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderNumber(ord.orderNumber)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition"
                          title="Salin Nomor Pesanan"
                        >
                          {copiedOrderNumber === ord.orderNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dipesan pada:{" "}
                        {new Date(ord.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRefreshSingleOrder(ord.orderNumber)}
                        disabled={refreshingOrder === ord.orderNumber}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Perbarui Status Pesanan"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            refreshingOrder === ord.orderNumber ? "animate-spin text-amber-600" : ""
                          }`}
                        />
                      </button>
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  {/* VISUAL STEPPER TRACKER (Friendly Customer Delivery Progression) */}
                  {!isCancelled && !isPending && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-rose-50/40 border border-amber-100">
                      <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
                        {TRACKING_STEPS.map((step, idx) => {
                          const stepNumber = idx + 1;
                          const isDone = currentStep >= stepNumber;
                          const isCurrent = currentStep === stepNumber;
                          const IconComp = step.icon;

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                              <div
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                                  isDone
                                    ? "bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-sm ring-2 ring-amber-200"
                                    : "bg-white text-slate-300 border border-slate-200"
                                } ${isCurrent ? "scale-105 ring-4 ring-amber-300 shadow-md animate-pulse" : ""}`}
                              >
                                <IconComp className="w-5 h-5" />
                              </div>

                              <span
                                className={`text-[10px] sm:text-xs font-bold mt-2 leading-tight ${
                                  isDone ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 px-5">
                        <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, Math.max(10, (currentStep / 4) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Active Status Note */}
                      <div className="mt-3 text-center">
                        <span className="text-[11px] text-amber-900 font-medium bg-white/80 px-3 py-1 rounded-full border border-amber-200/70 inline-block shadow-2xs">
                          {currentStep >= 1 && currentStep <= 4
                            ? TRACKING_STEPS[currentStep - 1].customerNote
                            : "Pesanan siap diproses"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Alert Box */}
                  {isCancelled && (
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-700 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-bold text-gray-800">Pesanan Dibatalkan</strong>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                          Pesanan ini telah dibatalkan. Jika Kakak membutuhkan bantuan atau pertanyaan terkait pesanan ini, silakan hubungi tim kami via WhatsApp ya!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending Alert Box */}
                  {isPending && (
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <strong className="block font-bold">Menunggu Pembayaran</strong>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Yuk selesaikan pembayaranmu agar koki SweetLayers bisa segera menyiapkan dessert box favoritmu!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items Receipt (Bakery Styled) */}
                  <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Rincian Dessert Box:
                    </span>
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-amber-100/60 last:border-none">
                          <div>
                            <span className="font-semibold text-slate-900">{it.productName}</span>{" "}
                            <span className="text-slate-500 text-[11px]">({it.variantName})</span>{" "}
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 font-bold rounded text-[10px]">
                              x{it.quantity}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            Rp {it.subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">Detail pesanan dessert</div>
                    )}
                  </div>

                  {/* Delivery & Schedule Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-2xl bg-white border border-amber-100 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pengiriman: {ord.deliveryMethod === "instant_courier" ? "Kurir Instan" : ord.deliveryMethod === "sameday" ? "Sameday" : "Ambil di Toko"}</span>
                      </div>
                      {ord.deliveryDate && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Jadwal: {ord.deliveryDate} {ord.deliveryTimeSlot ? `(${ord.deliveryTimeSlot})` : ""}</span>
                        </div>
                      )}
                      {ord.deliveryAddress && (
                        <div className="flex items-start gap-1.5 text-slate-600 text-[11px] pt-1 border-t border-amber-100">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{ord.deliveryAddress}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-amber-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Penerima Pesanan
                        </span>
                        <span className="font-bold text-slate-800 text-xs block">
                          {ord.customerName}
                        </span>
                        <span className="text-slate-500 text-[11px] block">{ord.customerPhone}</span>
                      </div>

                      <div className="pt-2 border-t border-amber-100 flex justify-between items-baseline mt-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Total Pembayaran:</span>
                        <span className="font-mono text-sm font-black text-amber-900">
                          Rp {ord.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Greeting Card if any */}
                  {ord.greetingCardText && (
                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs flex items-start gap-2">
                      <span className="text-sm">💌</span>
                      <div>
                        <strong className="font-bold text-rose-800">Pesan Manis di Kartu Ucapan:</strong>
                        <p className="text-[11px] text-rose-700 italic mt-0.5">"{ord.greetingCardText}"</p>
                      </div>
                    </div>
                  )}

                  {/* Friendly Customer Action: Contact Bakery via WhatsApp */}
                  <div className="pt-2 flex justify-end">
                    <a
                      href={`https://wa.me/6281234567890?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp Toko SweetLayers</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
