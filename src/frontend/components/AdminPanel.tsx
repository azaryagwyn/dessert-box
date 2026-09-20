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
  Server,
  ShieldCheck,
  ShieldAlert,
  Send,
  Lock,
  Upload,
  Camera,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import { Product, Order } from "../types";
import { useAuth } from "../context/AuthContext";

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
  const { user, isAdmin, authFetch, login, openLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "stock" | "proxy">("orders");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant stock editing state
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [isSavingStock, setIsSavingStock] = useState<string | null>(null);
  const [stockSuccessMsg, setStockSuccessMsg] = useState<string | null>(null);

  // Image Upload state
  const [uploadingProductId, setUploadingProductId] = useState<string | null>(null);
  const [imageSuccessMsg, setImageSuccessMsg] = useState<string | null>(null);
  const [editingImageUrlId, setEditingImageUrlId] = useState<string | null>(null);
  const [customImageUrlInput, setCustomImageUrlInput] = useState("");

  // Proxy state
  const [proxyOrderId, setProxyOrderId] = useState("");
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyResult, setProxyResult] = useState<any>(null);
  const [proxyCustomUrl, setProxyCustomUrl] = useState("https://api.sandbox.midtrans.com/v2/token");
  const [proxyFetchLoading, setProxyFetchLoading] = useState(false);
  const [proxyFetchResult, setProxyFetchResult] = useState<any>(null);

  // Handler for uploading product photo from device (auto-compressed to clean WebP/JPEG)
  const handleImageFileUpload = async (productId: string, file: File) => {
    if (!file) return;
    setUploadingProductId(productId);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new window.Image();
        img.onload = async () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to efficient JPEG Data URL
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

          // Save to backend database
          const res = await authFetch(`/api/admin/products/${productId}/image`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: compressedDataUrl }),
          });

          if (res.ok) {
            setProducts((prev) =>
              prev.map((p) => (p.id === productId ? { ...p, imageUrl: compressedDataUrl } : p))
            );
            setImageSuccessMsg("Foto produk berhasil diunggah & disimpan ke database!");
            setTimeout(() => setImageSuccessMsg(null), 3500);
            onRefreshData();
          } else {
            alert("Gagal menyimpan foto ke database.");
          }
          setUploadingProductId(null);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert("Error saat membaca file foto: " + err.message);
      setUploadingProductId(null);
    }
  };

  const handleSaveCustomImageUrl = async (productId: string) => {
    if (!customImageUrlInput.trim()) return;
    setUploadingProductId(productId);
    try {
      const res = await authFetch(`/api/admin/products/${productId}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: customImageUrlInput.trim() }),
      });

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, imageUrl: customImageUrlInput.trim() } : p))
        );
        setImageSuccessMsg("Path / URL foto produk berhasil diperbarui di database!");
        setTimeout(() => setImageSuccessMsg(null), 3500);
        setEditingImageUrlId(null);
        setCustomImageUrlInput("");
        onRefreshData();
      }
    } catch (err: any) {
      alert("Gagal memperbarui URL foto: " + err.message);
    } finally {
      setUploadingProductId(null);
    }
  };

  // Quick admin login state
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        authFetch("/api/admin/stats"),
        authFetch("/api/admin/orders"),
        fetch("/api/products"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleQuickAdminLogin = async () => {
    setAdminLoggingIn(true);
    await login("admin@sweetlayers.com", "AdminSweetLayers2026!");
    setAdminLoggingIn(false);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/status`, {
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
      const res = await authFetch(`/api/admin/variants/${variantId}/stock`, {
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

  const handleCheckProxyStatus = async () => {
    if (!proxyOrderId) return;
    setProxyLoading(true);
    setProxyResult(null);
    try {
      const res = await authFetch("/api/proxy/midtrans/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: proxyOrderId.trim() }),
      });
      const data = await res.json();
      setProxyResult({ status: res.status, data });
    } catch (err: any) {
      setProxyResult({ error: err.message || "Gagal menghubungi proxy" });
    } finally {
      setProxyLoading(false);
    }
  };

  const handleProxyCancelOrder = async () => {
    if (!proxyOrderId) return;
    if (!confirm(`Batalkan transaksi ${proxyOrderId} di Midtrans via server proxy?`)) return;
    setProxyLoading(true);
    try {
      const res = await authFetch("/api/proxy/midtrans/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: proxyOrderId.trim() }),
      });
      const data = await res.json();
      setProxyResult({ status: res.status, data });
    } catch (err: any) {
      setProxyResult({ error: err.message });
    } finally {
      setProxyLoading(false);
    }
  };

  const handleTestCustomProxyFetch = async () => {
    if (!proxyCustomUrl) return;
    setProxyFetchLoading(true);
    setProxyFetchResult(null);
    try {
      const res = await authFetch("/api/proxy/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: proxyCustomUrl.trim() }),
      });
      const data = await res.json();
      setProxyFetchResult(data);
    } catch (err: any) {
      setProxyFetchResult({ error: err.message });
    } finally {
      setProxyFetchLoading(false);
    }
  };

  // Lock Screen if not Admin
  if (!isAdmin) {
    return (
      <div className="bg-slate-900 text-slate-100 rounded-3xl p-8 shadow-2xl border border-slate-800 my-8 animate-fade-in text-center max-w-xl mx-auto">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-['Playfair_Display',serif] text-2xl font-bold text-white mb-2">
          Akses Terbatas: Administrator Only
        </h2>
        <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
          Panel pengelola toko dan modul server proxy hanya dapat diakses oleh akun Administrator SweetLayers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleQuickAdminLogin}
            disabled={adminLoggingIn}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
          >
            {adminLoggingIn ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>Masuk Akun Admin...</span>
              </>
            ) : (
              <>
                <span>👑</span>
                <span>Masuk Sebagai Admin (1-Klik)</span>
              </>
            )}
          </button>
          <button
            onClick={openLogin}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Buka Form Login
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-slate-500 hover:text-slate-400 text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-6 my-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 rounded-2xl font-bold shadow-md">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-bold text-white">
                Panel Pengelola Dapur & Pesanan
              </h2>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold">
                ADMIN: {user?.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Database Cloudflare D1 (SQLite) • Monitor Omset, Stok Harian & Proxy Server
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

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Kelola Pesanan Masuk ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "stock"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Kelola Menu, Foto & Stok Dapur</span>
        </button>

        <button
          onClick={() => setActiveTab("proxy")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "proxy"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Proxy Server & Midtrans Gateway</span>
        </button>
      </div>

      {/* Success banner */}
      {stockSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{stockSuccessMsg}</span>
        </div>
      )}

      {imageSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{imageSuccessMsg}</span>
        </div>
      )}

      {/* TAB 1: ORDERS LIST */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">No. Pesanan & Waktu</th>
                  <th className="p-3">Pelanggan</th>
                  <th className="p-3">Item Pesanan</th>
                  <th className="p-3">Total & Pengiriman</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Belum ada transaksi pesanan yang tercatat di database.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-amber-400 block">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-white block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-400 block">{ord.customerPhone}</span>
                        <span className="text-[10px] text-slate-500">{ord.customerEmail}</span>
                      </td>

                      <td className="p-3">
                        <div className="space-y-1">
                          {ord.items && ord.items.length > 0 ? (
                            ord.items.map((item, idx) => (
                              <div key={idx} className="text-[11px]">
                                <span className="font-medium text-slate-200">{item.productName}</span>{" "}
                                <span className="text-slate-400">({item.variantName})</span> x{item.quantity}
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Data item tersimpan</span>
                          )}
                          {ord.greetingCardText && (
                            <div className="p-1.5 bg-slate-800 rounded text-[10px] text-amber-300 italic">
                              💌 "{ord.greetingCardText}"
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-white block">
                          Rp {ord.totalAmount.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase block">
                          {ord.deliveryMethod.replace("_", " ")}
                        </span>
                        {ord.deliveryDate && (
                          <span className="text-[10px] text-amber-400/80">
                            {ord.deliveryDate} ({ord.deliveryTimeSlot})
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : ord.status === "completed"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : ord.status === "cancelled"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {ord.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {ord.status === "pending" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "paid")}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition"
                              title="Tandai Sudah Dibayar"
                            >
                              Tandai Bayar
                            </button>
                          )}
                          {ord.status === "paid" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "completed")}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Tandai Pesanan Selesai Dikirim"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Selesai</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveTab("proxy");
                              setProxyOrderId(ord.orderNumber);
                            }}
                            className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded text-[10px] transition"
                            title="Periksa status transaksi di Midtrans melalui proxy"
                          >
                            🛡️ Proxy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MENU, PHOTOS & STOCK MANAGEMENT */}
      {activeTab === "stock" && (
        <div className="space-y-4">
          {/* Info Card on Photo Management */}
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
            <div className="p-2 bg-amber-900/80 rounded-xl text-amber-300 flex-shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-amber-200">
                🖼️ Manajemen Aset Foto Menu Asli Toko
              </h4>
              <p className="text-amber-300/90 leading-relaxed">
                Anda dapat mengganti foto menu dummy dengan foto asli buatan Anda. Klik tombol <strong>"Unggah Foto"</strong> untuk memilih file gambar dari laptop/HP (otomatis dioptimasi dan disimpan ke database), atau gunakan tombol rantai <strong>(🔗)</strong> untuk memasukkan path file lokal (misalnya <code className="bg-amber-900/80 px-1 py-0.5 rounded text-amber-200">/images/products/foto-anda.jpg</code>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative group flex-shrink-0">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700 shadow-sm"
                      />
                      <label
                        className="absolute inset-0 bg-black/70 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[10px] text-white font-medium"
                        title="Klik untuk ganti foto dari file di laptop/HP"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Ganti</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileUpload(p.id, file);
                          }}
                        />
                      </label>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <span className="text-[11px] text-slate-400">Total Stok: {p.totalStock} box</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <label
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                      title="Unggah foto asli Anda dari perangkat"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {uploadingProductId === p.id ? "Menyimpan..." : "Unggah Foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingProductId === p.id}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileUpload(p.id, file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        if (editingImageUrlId === p.id) {
                          setEditingImageUrlId(null);
                        } else {
                          setEditingImageUrlId(p.id);
                          setCustomImageUrlInput(p.imageUrl);
                        }
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs transition"
                      title="Ubah path file lokal atau URL"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Custom Path/URL Editor */}
                {editingImageUrlId === p.id && (
                  <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-700 text-xs space-y-2 animate-fade-in">
                    <label className="block text-[11px] text-slate-300 font-semibold">
                      Masukkan Path Aset Lokal atau URL Foto:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customImageUrlInput}
                        onChange={(e) => setCustomImageUrlInput(e.target.value)}
                        placeholder="Contoh: /images/products/foto.jpg"
                        className="flex-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCustomImageUrl(p.id)}
                        disabled={uploadingProductId === p.id || !customImageUrlInput.trim()}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}

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
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROXY SERVER MODULE */}
      {activeTab === "proxy" && (
        <div className="space-y-6">
          {/* Architecture info banner */}
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 flex items-start gap-3">
            <div className="p-2 bg-purple-900/80 rounded-xl text-purple-300 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-purple-200">
                SweetLayers Reverse Proxy Engine Active
              </h4>
              <p className="text-purple-300/80 leading-relaxed">
                Modul Proxy Server (`/api/proxy/*`) mengamankan komunikasi eksternal. Semua kredensial sensitif seperti
                Midtrans Server Key (<code className="bg-purple-900 px-1 py-0.5 rounded text-purple-200">Mid-server-***</code>)
                disimpan secara eksklusif di server-side (Cloudflare Pages Functions) sehingga tidak pernah terekspos ke browser
                klien dan bebas hambatan CORS (Cross-Origin Resource Sharing).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tool 1: Midtrans Gateway Proxy */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">💳</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Midtrans Sandbox Proxy Inspector</h3>
                  <p className="text-[11px] text-slate-400">
                    Endpoint: <code className="text-amber-400 font-mono">POST /api/proxy/midtrans/status</code>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Order ID / Nomor Pesanan
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={proxyOrderId}
                    onChange={(e) => setProxyOrderId(e.target.value)}
                    placeholder="Contoh: DB-20260920-1234"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleCheckProxyStatus}
                    disabled={proxyLoading || !proxyOrderId}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    {proxyLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Cek Status</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleProxyCancelOrder}
                  disabled={proxyLoading || !proxyOrderId}
                  className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-lg text-xs transition disabled:opacity-50"
                >
                  Batalkan Transaksi via Proxy
                </button>
              </div>

              {proxyResult && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60">
                  <div className="text-amber-400 font-bold mb-1">Response Gateway Proxy:</div>
                  <pre>{JSON.stringify(proxyResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Tool 2: Outbound Reverse Proxy */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Universal Outbound HTTP Proxy</h3>
                  <p className="text-[11px] text-slate-400">
                    Endpoint: <code className="text-amber-400 font-mono">POST /api/proxy/fetch</code>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target URL (External API / Courier / Webhook)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={proxyCustomUrl}
                    onChange={(e) => setProxyCustomUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleTestCustomProxyFetch}
                    disabled={proxyFetchLoading || !proxyCustomUrl}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                  >
                    {proxyFetchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Test Fetch</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Fitur ini dapat digunakan untuk integrasi sistem logistik (tracking kurir instan/sameday) dan verifikasi respon API tanpa memicu CORS di sisi browser.
              </div>

              {proxyFetchResult && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60">
                  <div className="text-emerald-400 font-bold mb-1">Hasil Proxy Outbound:</div>
                  <pre>{JSON.stringify(proxyFetchResult, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
