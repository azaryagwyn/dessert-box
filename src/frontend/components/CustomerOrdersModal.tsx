import React, { useState, useEffect } from "react";
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
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, authFetch } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [proxyStatus, setProxyStatus] = useState<{ [orderNumber: string]: any }>({});
  const [checkingProxy, setCheckingProxy] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    async function fetchOrders() {
      setIsLoading(true);
      try {
        const res = await authFetch("/api/customer/orders");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOrders(Array.isArray(data) ? data : []);
          }
        }
      } catch (err) {
        console.error("Gagal memuat riwayat pesanan:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, authFetch]);

  if (!isOpen) return null;

  const checkMidtransProxyStatus = async (orderNumber: string) => {
    setCheckingProxy(orderNumber);
    try {
      const res = await authFetch("/api/proxy/midtrans/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderNumber }),
      });
      const data = await res.json();
      setProxyStatus((prev) => ({ ...prev, [orderNumber]: data }));
    } catch (err: any) {
      setProxyStatus((prev) => ({
        ...prev,
        [orderNumber]: { error: err.message || "Gagal cek status proxy" },
      }));
    } finally {
      setCheckingProxy(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Lunas / Diproses
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">
            Pesanan Selesai
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-full">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            Menunggu Pembayaran
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center text-xl">
              📦
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Riwayat Pesanan Saya</h2>
              <p className="text-xs text-gray-500">
                Akun: <span className="font-medium text-pink-600">{user?.name}</span> ({user?.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-12 text-center text-gray-500 text-sm flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
              <span>Memuat riwayat transaksi pesanan...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3">🛍️</div>
              <h3 className="font-semibold text-gray-800 text-base">Belum Ada Pesanan</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Anda belum pernah memesan dessert box. Temukan pilihan dessert manis premium kami di katalog!
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-semibold shadow hover:opacity-95 transition"
              >
                Mulai Belanja Sekarang
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id || ord.orderNumber}
                className="border border-gray-200 rounded-xl p-4 hover:border-pink-300 transition bg-white shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-800">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      {new Date(ord.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {getStatusBadge(ord.status)}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3">
                  {ord.items && ord.items.length > 0 ? (
                    ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-700">
                        <span>
                          <span className="font-medium text-gray-900">{it.productName}</span>{" "}
                          <span className="text-gray-500">({it.variantName})</span> x{it.quantity}
                        </span>
                        <span className="font-semibold">
                          Rp {it.subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 italic">Detail pesanan dessert</div>
                  )}
                </div>

                {/* Delivery & Total */}
                <div className="bg-gray-50 rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="text-gray-600">
                    <span className="block font-medium text-gray-800">
                      Metode: {ord.deliveryMethod === "instant_courier" ? "Kurir Instan" : ord.deliveryMethod === "sameday" ? "Sameday" : "Ambil Sendiri (Pickup)"}
                    </span>
                    {ord.deliveryDate && (
                      <span className="text-[11px] text-gray-500">
                        Jadwal: {ord.deliveryDate} {ord.deliveryTimeSlot ? `(${ord.deliveryTimeSlot})` : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">Total Pembayaran</span>
                    <span className="text-sm font-bold text-pink-600">
                      Rp {ord.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Proxy Server Live Midtrans Status Inspection */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Payment Gateway: <span className="font-mono text-gray-600">Midtrans Sandbox</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => checkMidtransProxyStatus(ord.orderNumber)}
                    disabled={checkingProxy === ord.orderNumber}
                    className="text-xs px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg transition font-medium flex items-center gap-1.5"
                  >
                    {checkingProxy === ord.orderNumber ? (
                      <>
                        <div className="w-3 h-3 border-2 border-pink-400 border-t-pink-700 rounded-full animate-spin" />
                        <span>Cek Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>🛡️</span> Cek Live Status (Proxy)
                      </>
                    )}
                  </button>
                </div>

                {/* Proxy Response Display */}
                {proxyStatus[ord.orderNumber] && (
                  <div className="mt-2.5 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto">
                    <div className="text-amber-400 font-bold mb-1 flex items-center justify-between">
                      <span>Live Response dari Midtrans via Proxy:</span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                        Status Code: {proxyStatus[ord.orderNumber].status_code || "200"}
                      </span>
                    </div>
                    <pre className="text-[10px] leading-relaxed">
                      {JSON.stringify(proxyStatus[ord.orderNumber], null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
