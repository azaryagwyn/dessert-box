import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Save,
  CheckCircle,
  Clock,
  Truck,
  Check,
} from "lucide-react";
import { Product, Order } from "../types";

interface AdminPanelProps {
  onClose: () => void;
  onRefreshData: () => void;
}

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<"orders" | "stock">("orders");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant stock editing state
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [isSavingStock, setIsSavingStock] = useState<string | null>(null);
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/orders"),
        fetch("/api/products"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o)));
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveVariantStock = async (variantId: string) => {
    const newStock = stockEdits[variantId];
    if (newStock === undefined) return;

    setIsSavingStock(variantId);
    try {
      const res = await fetch(`/api/admin/variants/${variantId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      if (res.ok) {
        setStockSuccessMsg(`Stok varian berhasil diperbarui menjadi ${newStock} box.`);
        setTimeout(() => setStockSuccessMsg(null), 3000);
        await fetchAdminData();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingStock(null);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 my-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-bold shadow-md">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Playfair_Display',serif] text-2xl font-bold text-white">
              Panel Pengelola Dapur & Pesanan
            </h2>
            <p className="text-xs text-slate-400">
              Database Cloudflare D1 (SQLite) • Monitor Omset, Stok Harian & Status Order
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Tutup Panel
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Pendapatan</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-white">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Pesanan</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-white">{stats.totalOrders} Transaksi</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Dapur Memproses</span>
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-xl font-black text-orange-400">{stats.processingOrders} Order</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Stok Kritis (&le;5)</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xl font-black text-rose-400">{stats.lowStockCount} Varian</span>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "orders"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Kelola Pesanan ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "stock"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Update Stok Dessert Box</span>
        </button>
      </div>

      {/* Tab 1: Orders Management */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">Belum ada transaksi pesanan masuk.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">No. Order & Waktu</th>
                    <th className="py-3 px-3">Pelanggan</th>
                    <th className="py-3 px-3">Pengiriman & Catatan</th>
                    <th className="py-3 px-3">Menu Dipesan</th>
                    <th className="py-3 px-3">Total</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-amber-400 block">{order.orderNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(order.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-200 block">{order.customerName}</span>
                        <span className="text-[11px] text-slate-400">{order.customerPhone}</span>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] uppercase font-semibold">
                          {order.deliveryMethod === "instant_courier"
                            ? "🚀 Instan"
                            : order.deliveryMethod === "sameday"
                            ? "🛵 Sameday"
                            : "🏬 Pick-up"}
                        </span>
                        {order.deliveryAddress && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{order.deliveryAddress}</p>
                        )}
                        {order.greetingCardText && (
                          <p className="text-[11px] text-rose-300 italic mt-0.5 line-clamp-1">
                            💌 "{order.greetingCardText}"
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {order.items?.map((it) => (
                          <div key={it.id} className="text-[11px] text-slate-300">
                            {it.productName} ({it.variantName}) x{it.quantity}
                          </div>
                        ))}
                      </td>

                      <td className="py-3 px-3 font-bold text-emerald-400">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            order.status === "paid"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                              : order.status === "kitchen_processing"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : order.status === "out_for_delivery"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : order.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {order.status === "paid"
                            ? "Terbayar (Siap Masak)"
                            : order.status === "kitchen_processing"
                            ? "Sedang Dibuat di Dapur"
                            : order.status === "out_for_delivery"
                            ? "Sedang Diantar Kurir"
                            : order.status === "completed"
                            ? "Pesanan Selesai"
                            : "Menunggu Pembayaran"}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2 py-1 focus:outline-none focus:border-amber-500"
                        >
                          <option value="pending">Menunggu Bayar</option>
                          <option value="paid">Terbayar</option>
                          <option value="kitchen_processing">Proses Dapur</option>
                          <option value="out_for_delivery">Diantar Kurir</option>
                          <option value="completed">Selesai</option>
                          <option value="cancelled">Batalkan</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Stock Management */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {stockSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{stockSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-700"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <span className="text-[11px] text-slate-400">Total Stok: {p.totalStock} box</span>
                    </div>
                  </div>

                  {/* Variants stock list */}
                  <div className="space-y-2 pt-2 border-t border-slate-700/60">
                    {p.variants.map((v) => {
                      const currentVal = stockEdits[v.id] !== undefined ? stockEdits[v.id] : v.stock;
                      const hasChanged = stockEdits[v.id] !== undefined && stockEdits[v.id] !== v.stock;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-300 block">{v.variantName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{v.sku}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={currentVal}
                              onChange={(e) =>
                                setStockEdits((prev) => ({
                                  ...prev,
                                  [v.id]: Math.max(0, parseInt(e.target.value) || 0),
                                }))
                              }
                              className="w-16 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-center font-bold text-white focus:outline-none focus:border-amber-500"
                            />

                            <button
                              onClick={() => handleSaveVariantStock(v.id)}
                              disabled={!hasChanged || isSavingStock === v.id}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                hasChanged
                                  ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                              title="Simpan Perubahan Stok"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
