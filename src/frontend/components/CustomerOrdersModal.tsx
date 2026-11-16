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
  ShieldCheck,
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
  const [proxyStatus, setProxyStatus] = useState<{ [orderNumber: string]: any }>({});
  const [checkingProxy, setCheckingProxy] = useState<string | null>(null);

  // Load orders when modal opens
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
      // If guest, try reading recent orders from localStorage
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
      setSearchError("Silakan ketik nomor pesanan (cth: DB-261112-4590) atau email.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // First try single order lookup
      const res = await fetch(`/api/orders/track?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setOrders(data);
          return;
        }
      }

      // Fallback: try direct order number lookup
      const singleRes = await fetch(`/api/orders/${encodeURIComponent(q.toUpperCase())}`);
      if (singleRes.ok) {
        const singleData = await singleRes.json();
        if (singleData && singleData.orderNumber) {
          setOrders([singleData]);
          return;
        }
      }

      // Check localStorage fallback
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

      setSearchError(`Pesanan dengan kata kunci "${q}" tidak ditemukan. Pastikan nomor pesanan atau email sudah benar.`);
    } catch (err: any) {
      setSearchError("Gagal menghubungi server pelacakan pesanan. Silakan coba lagi.");
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

  const checkMidtransProxyStatus = async (orderNumber: string) => {
    setCheckingProxy(orderNumber);
    try {
      const res = await fetch("/api/proxy/midtrans/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderNumber }),
      });
      const data = await res.json();
      setProxyStatus((prev) => ({ ...prev, [orderNumber]: data }));
    } catch (err: any) {
      setProxyStatus((prev) => ({
        ...prev,
        [orderNumber]: { error: err.message || "Gagal cek status gateway" },
      }));
    } finally {
      setCheckingProxy(null);
    }
  };

  if (!isOpen) return null;

  const TRACKING_STEPS = [
    {
      key: "paid",
      title: "Pembayaran Terverifikasi",
      desc: "Pesanan diterima sistem",
      icon: CheckCircle2,
    },
    {
      key: "kitchen_processing",
      title: "Dipersiapkan di Dapur",
      desc: "Koki meracik dessert fresh",
      icon: ChefHat,
    },
    {
      key: "out_for_delivery",
      title: "Dalam Pengiriman",
      desc: "Kurir mengantar pesanan",
      icon: Truck,
    },
    {
      key: "completed",
      title: "Pesanan Tiba",
      desc: "Pesanan selesai & dinikmati",
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
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Lunas / Siap Dapur
          </span>
        );
      case "kitchen_processing":
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <ChefHat className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
            Dipersiapkan di Dapur
          </span>
        );
      case "out_for_delivery":
        return (
          <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            Sedang Dikirim Kurir
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-300 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Pesanan Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-300 text-xs font-bold rounded-full flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Menunggu Pembayaran
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-amber-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-amber-100/80 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-2xl shadow-inner">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-['Playfair_Display',serif] font-black text-xl sm:text-2xl text-white tracking-tight">
                Lacak Status Pesanan
              </h2>
              <p className="text-xs text-amber-100 mt-0.5 font-medium">
                Pantau proses dapur dan pengiriman dessert box Anda secara real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-all"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Filter Section */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-50/60 to-white border-b border-gray-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrackQuery();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masukkan Nomor Pesanan (cth: DB-261112-4590) atau Email Anda..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSearching}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Lacak Pesanan</span>
                  </>
                )}
              </button>
              {user && (
                <button
                  type="button"
                  onClick={fetchUserOrders}
                  disabled={isLoading}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition flex items-center gap-1"
                  title="Lihat semua pesanan akun saya"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Pesanan Saya</span>
                </button>
              )}
            </div>
          </form>

          {searchError && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Content Body: List of Tracked Orders */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <span className="font-medium text-slate-600">Memeriksa status pesanan terkini...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
                🔍
              </div>
              <h3 className="font-['Playfair_Display',serif] font-bold text-slate-800 text-lg">
                Belum Ada Pesanan yang Dilacak
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Ketik nomor pesanan invoice Anda pada kolom pencarian di atas untuk melihat progres pembuatan dan pengiriman dessert box Anda.
              </p>
            </div>
          ) : (
            orders.map((ord) => {
              const currentStep = getStepProgressIndex(ord.status);
              const isCancelled = ord.status === "cancelled";
              const isPending = ord.status === "pending";

              const whatsappMessage = encodeURIComponent(
                `Halo SweetLayers! Saya ingin menanyakan status pesanan #${ord.orderNumber} atas nama ${ord.customerName}. Terima kasih!`
              );

              return (
                <div
                  key={ord.id || ord.orderNumber}
                  className="border border-slate-200 rounded-3xl p-5 hover:border-amber-300 transition-all bg-white shadow-sm space-y-4"
                >
                  {/* Top Bar: Order Number, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-slate-900 tracking-wide">
                          #{ord.orderNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyOrderNumber(ord.orderNumber)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                          title="Salin Nomor Pesanan"
                        >
                          {copiedOrderNumber === ord.orderNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                        Waktu Pemesanan:{" "}
                        {new Date(ord.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
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
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                        title="Perbarui Status Pesanan"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            refreshingOrder === ord.orderNumber ? "animate-spin text-amber-500" : ""
                          }`}
                        />
                      </button>
                      {getStatusBadge(ord.status)}
                    </div>
                  </div>

                  {/* VISUAL STEPPER TRACKER */}
                  {!isCancelled && !isPending && (
                    <div className="py-2 px-1 sm:px-3 bg-gradient-to-r from-amber-50/50 via-rose-50/30 to-purple-50/40 rounded-2xl border border-amber-100/70">
                      <div className="grid grid-cols-4 gap-1 sm:gap-2 relative">
                        {TRACKING_STEPS.map((step, idx) => {
                          const stepNumber = idx + 1;
                          const isDone = currentStep >= stepNumber;
                          const isCurrent = currentStep === stepNumber;
                          const IconComp = step.icon;

                          return (
                            <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                              {/* Step Icon Circle */}
                              <div
                                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs transition-all shadow-sm ${
                                  isDone
                                    ? "bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-bold ring-2 ring-amber-200"
                                    : "bg-white text-slate-300 border border-slate-200"
                                } ${isCurrent ? "scale-105 ring-4 ring-amber-300 shadow-md animate-pulse" : ""}`}
                              >
                                <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>

                              {/* Step Label */}
                              <span
                                className={`text-[10px] sm:text-xs font-bold mt-2 leading-tight ${
                                  isDone ? "text-slate-900" : "text-slate-400"
                                }`}
                              >
                                {step.title}
                              </span>
                              <span className="hidden sm:block text-[9px] text-slate-400 mt-0.5 leading-tight">
                                {step.desc}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress Line */}
                      <div className="mt-3 px-6">
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(10, (currentStep / 4) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cancelled Banner */}
                  {isCancelled && (
                    <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Pesanan Telah Dibatalkan</strong>
                        <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                          Pesanan ini telah dibatalkan oleh pihak toko. Stok dessert box telah dikembalikan secara otomatis. Silakan hubungi admin kami via WhatsApp jika ada pertanyaan mengenai pengembalian dana.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pending Banner */}
                  {isPending && (
                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
                      <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Menunggu Pembayaran</strong>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Selesaikan pembayaran Anda melalui Midtrans Snap agar pesanan dapat segera dipersiapkan oleh tim dapur kami.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Menu yang Dipesan:
                    </span>
                    {ord.items && ord.items.length > 0 ? (
                      ord.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-100 last:border-none">
                          <div>
                            <span className="font-semibold text-slate-900">{it.productName}</span>{" "}
                            <span className="text-slate-500">({it.variantName})</span>{" "}
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                              x{it.quantity}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-900">
                            Rp {it.subtotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic">Detail pesanan dessert box</div>
                    )}
                  </div>

                  {/* Delivery & Schedule Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pengiriman: {ord.deliveryMethod === "instant_courier" ? "Kurir Instan" : ord.deliveryMethod === "sameday" ? "Sameday" : "Ambil di Toko"}</span>
                      </div>
                      {ord.deliveryDate && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Tanggal: {ord.deliveryDate}</span>
                        </div>
                      )}
                      {ord.deliveryTimeSlot && (
                        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Slot: {ord.deliveryTimeSlot}</span>
                        </div>
                      )}
                      {ord.deliveryAddress && (
                        <div className="flex items-start gap-1.5 text-slate-600 text-[11px] pt-1 border-t border-amber-200/50">
                          <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{ord.deliveryAddress}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Penerima Pesanan
                        </span>
                        <span className="font-bold text-slate-800 text-xs block">
                          {ord.customerName}
                        </span>
                        <span className="text-slate-500 text-[11px] block">{ord.customerPhone}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline mt-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Total Dibayar:</span>
                        <span className="font-mono text-sm font-black text-amber-900">
                          Rp {ord.totalAmount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Greeting Card if provided */}
                  {ord.greetingCardText && (
                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-900 text-xs flex items-start gap-2">
                      <span className="text-sm">💌</span>
                      <div>
                        <strong className="font-bold text-rose-800">Kartu Ucapan Kado:</strong>
                        <p className="text-[11px] text-rose-700 italic mt-0.5">"{ord.greetingCardText}"</p>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => checkMidtransProxyStatus(ord.orderNumber)}
                      disabled={checkingProxy === ord.orderNumber}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-medium flex items-center gap-1.5"
                    >
                      {checkingProxy === ord.orderNumber ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
                          <span>Cek Gateway...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                          <span>Status Gateway (Midtrans)</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/6281234567890?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp Toko</span>
                    </a>
                  </div>

                  {/* Midtrans Proxy Response details */}
                  {proxyStatus[ord.orderNumber] && (
                    <div className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto">
                      <div className="text-amber-400 font-bold mb-1 flex items-center justify-between">
                        <span>Response Midtrans Proxy:</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          Status Code: {proxyStatus[ord.orderNumber].status_code || "200"}
                        </span>
                      </div>
                      <pre className="text-[10px] leading-relaxed">
                        {JSON.stringify(proxyStatus[ord.orderNumber], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
