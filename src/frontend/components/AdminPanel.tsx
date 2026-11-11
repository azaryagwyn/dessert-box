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
  Tag,
  Plus,
  Users,
  Award,
  Sparkles,
  Ban,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  History,
  RotateCcw,
  Flame,
} from "lucide-react";
import { Product, Order, StockLog, CustomerCRM, Promotion } from "../types";
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
  const { user, isAdmin, authFetch, openLogin } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "products" | "stock" | "promos" | "crm" | "proxy">("orders");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [customers, setCustomers] = useState<CustomerCRM[]>([]);
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

  // Product Add / Edit Modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    categoryId: "cat_choco",
    basePrice: 48000,
    originalPrice: 58000,
    description: "",
    shortDesc: "",
    badge: "Menu Baru ✨",
    temperatureInfo: "Simpan dalam chiller suhu 2-6°C. Tahan 4-5 hari.",
    imageUrl: "/images/products/belgian-dark-choco.jpg",
    variantName: "Personal Box (350ml)",
    stock: 12,
  });

  // Promo Add Modal state
  const [isAddPromoOpen, setIsAddPromoOpen] = useState(false);
  const [newPromo, setNewPromo] = useState({
    code: "",
    title: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 20,
    minPurchase: 50000,
    maxDiscount: 25000,
    quota: 100,
    maxUsagePerUser: 1,
    targetSegment: "all" as "all" | "new" | "repeat" | "loyal" | "inactive" | "specific_email",
    targetCustomerEmail: "",
  });

  // CRM state
  const [crmFilterSegment, setCrmFilterSegment] = useState<string>("all");
  const [crmSearch, setCrmSearch] = useState("");
  const [crmRetentionMsg, setCrmRetentionMsg] = useState<string | null>(null);

  // Order filter state
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>("all");

  // Proxy state
  const [proxyOrderId, setProxyOrderId] = useState("");
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyResult, setProxyResult] = useState<any>(null);
  const [proxyCustomUrl, setProxyCustomUrl] = useState("https://api.sandbox.midtrans.com/v2/token");
  const [proxyFetchLoading, setProxyFetchLoading] = useState(false);
  const [proxyFetchResult, setProxyFetchResult] = useState<any>(null);

  // Image File Upload handler
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

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);

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

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      let localOrders: any[] = [];
      try {
        const raw = localStorage.getItem("sweetlayers_all_orders");
        if (raw) localOrders = JSON.parse(raw);
      } catch (e) {}

      if (localOrders.length > 0) {
        await authFetch("/api/admin/sync-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orders: localOrders }),
        }).catch(() => {});
      }

      const [statsRes, ordersRes, productsRes, stockLogsRes, promosRes, crmRes] = await Promise.all([
        authFetch("/api/admin/stats"),
        authFetch("/api/admin/orders"),
        fetch("/api/products"),
        authFetch("/api/admin/stock-logs"),
        authFetch("/api/admin/promotions"),
        authFetch("/api/admin/crm/customers"),
      ]);

      let fetchedOrders: any[] = [];
      if (ordersRes.ok) fetchedOrders = await ordersRes.json();
      if (productsRes.ok) setProducts(await productsRes.json());
      if (stockLogsRes.ok) setStockLogs(await stockLogsRes.json());
      if (promosRes.ok) setPromotions(await promosRes.json());
      if (crmRes.ok) setCustomers(await crmRes.json());

      const mergedMap = new Map<string, any>();
      if (Array.isArray(fetchedOrders)) {
        for (const ord of fetchedOrders) {
          if (ord && ord.orderNumber) mergedMap.set(ord.orderNumber, ord);
        }
      }
      if (Array.isArray(localOrders)) {
        for (const ord of localOrders) {
          if (ord && ord.orderNumber && !mergedMap.has(ord.orderNumber)) {
            mergedMap.set(ord.orderNumber, ord);
          }
        }
      }

      const finalOrders = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
      setOrders(finalOrders);

      if (statsRes.ok) {
        const serverStats = await statsRes.json();
        const calculatedRevenue = finalOrders
          .filter((o) => o.status !== "pending" && o.status !== "cancelled")
          .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

        setStats({
          ...serverStats,
          totalRevenue: Math.max(serverStats.totalRevenue || 0, calculatedRevenue),
          totalOrders: Math.max(serverStats.totalOrders || 0, finalOrders.length),
          processingOrders: finalOrders.filter((o) => o.status === "paid" || o.status === "kitchen_processing").length,
          completedOrders: finalOrders.filter((o) => o.status === "completed").length,
          pendingOrders: finalOrders.filter((o) => o.status === "pending").length,
        });
      }
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

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      try {
        const raw = localStorage.getItem("sweetlayers_all_orders");
        if (raw) {
          const arr = JSON.parse(raw);
          const updated = arr.map((o: any) =>
            o.id === orderId || o.orderNumber === orderId ? { ...o, status } : o
          );
          localStorage.setItem("sweetlayers_all_orders", JSON.stringify(updated));
        }
      } catch (e) {}

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

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Batalkan pesanan #${orderNumber}? Stok produk yang dibeli akan dikembalikan secara otomatis ke dapur.`)) return;

    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Dibatalkan oleh Admin Toko" }),
      });

      if (res.ok) {
        setStockSuccessMsg(`Pesanan #${orderNumber} berhasil dibatalkan dan stok dikembalikan!`);
        setTimeout(() => setStockSuccessMsg(null), 3500);

        try {
          const raw = localStorage.getItem("sweetlayers_all_orders");
          if (raw) {
            const arr = JSON.parse(raw);
            const updated = arr.map((o: any) =>
              o.id === orderId || o.orderNumber === orderNumber ? { ...o, status: "cancelled" } : o
            );
            localStorage.setItem("sweetlayers_all_orders", JSON.stringify(updated));
          }
        } catch (e) {}

        await fetchAdminData();
        onRefreshData();
      } else {
        alert("Gagal membatalkan pesanan.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: newProduct.categoryId,
          name: newProduct.name,
          basePrice: Number(newProduct.basePrice),
          originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
          description: newProduct.description || newProduct.name,
          shortDesc: newProduct.shortDesc || newProduct.name,
          badge: newProduct.badge,
          temperatureInfo: newProduct.temperatureInfo,
          imageUrl: newProduct.imageUrl,
          variants: [
            {
              variantName: newProduct.variantName,
              additionalPrice: 0,
              stock: Number(newProduct.stock),
            },
          ],
        }),
      });

      if (res.ok) {
        setIsAddProductOpen(false);
        setStockSuccessMsg(`Produk "${newProduct.name}" berhasil ditambahkan ke katalog & stok tercatat!`);
        setTimeout(() => setStockSuccessMsg(null), 3500);
        await fetchAdminData();
        onRefreshData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menambah produk");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPromo),
      });

      if (res.ok) {
        setIsAddPromoOpen(false);
        setStockSuccessMsg(`Voucher promo [${newPromo.code.toUpperCase()}] berhasil dibuat!`);
        setTimeout(() => setStockSuccessMsg(null), 3500);
        await fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal membuat promo");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleTogglePromo = async (promoId: string) => {
    try {
      const res = await authFetch(`/api/admin/promotions/${promoId}/toggle`, {
        method: "PATCH",
      });
      if (res.ok) {
        await fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendRetentionAction = async (customer: CustomerCRM, voucherCode: string, actionType: string) => {
    try {
      const res = await authFetch("/api/admin/crm/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: customer.email,
          customerName: customer.name,
          promoCode: voucherCode,
          actionType,
          notes: `Voucher diskon ${voucherCode} dikirim ke ${customer.name} (${customer.segment})`,
        }),
      });

      if (res.ok) {
        setCrmRetentionMsg(`Voucher [${voucherCode}] berhasil dikirim ke pelanggan: ${customer.name} (${customer.email})!`);
        setTimeout(() => setCrmRetentionMsg(null), 4000);
        await fetchAdminData();
      }
    } catch (err: any) {
      alert("Error: " + err.message);
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
            onClick={openLogin}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl text-xs transition shadow-md"
          >
            Masuk dengan Akun Admin
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilterStatus === "all") return true;
    return o.status === orderFilterStatus;
  });

  // Filtered CRM customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSegment = crmFilterSegment === "all" || c.segment === crmFilterSegment;
    const matchesSearch =
      crmSearch.trim() === "" ||
      c.name.toLowerCase().includes(crmSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(crmSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(crmSearch));
    return matchesSegment && matchesSearch;
  });

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
                Panel Pusat Administrator & Dapur
              </h2>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full text-[10px] font-mono font-bold">
                ADMIN: {user?.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SweetLayers E-Commerce • Pesanan, Stok, Promosi, CRM & Proxy Gateway
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
              <span className="text-xs font-semibold">Total Omset Terverifikasi</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-white">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-semibold">Total Transaksi</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-white">{stats.totalOrders} Pesanan</span>
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

      {/* Alert Banner: Notifikasi Stok Hampir Habis untuk Admin */}
      {(() => {
        const lowStockVariants = products.flatMap((p) =>
          p.variants
            .filter((v) => v.stock <= 5)
            .map((v) => ({ ...v, productName: p.name }))
        );
        if (lowStockVariants.length === 0) return null;

        return (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-500 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-amber-300 flex items-center gap-2">
                  <span>Peringatan Stok Dapur Kritis!</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                    {lowStockVariants.length} Varian Butuh Restock
                  </span>
                </h4>
                <p className="text-[11px] text-amber-200/80 mt-0.5">
                  {lowStockVariants
                    .slice(0, 4)
                    .map((v) => `${v.productName} (${v.variantName}: sisa ${v.stock} box)`)
                    .join(" • ")}
                  {lowStockVariants.length > 4 && ` ...dan ${lowStockVariants.length - 4} lainnya`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("stock")}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition shadow-md flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kelola Stok Varian &rarr;</span>
            </button>
          </div>
        );
      })()}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "orders"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pesanan ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "products"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Katalog Produk ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "stock"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stok & Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveTab("promos")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "promos"
              ? "border-amber-500 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Manajemen Promo ({promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("crm")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "crm"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CRM & Retensi ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("proxy")}
          className={`pb-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "proxy"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Proxy Gateway</span>
        </button>
      </div>

      {/* Success banner */}
      {stockSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{stockSuccessMsg}</span>
        </div>
      )}

      {imageSuccessMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{imageSuccessMsg}</span>
        </div>
      )}

      {crmRetentionMsg && (
        <div className="p-3 bg-purple-950/80 border border-purple-500/40 text-purple-300 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{crmRetentionMsg}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: ORDERS LIST                                       */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              {["all", "pending", "paid", "kitchen_processing", "out_for_delivery", "completed", "cancelled"].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition ${
                    orderFilterStatus === st
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">Menampilkan {filteredOrders.length} pesanan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/60 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">No. Pesanan & Waktu</th>
                  <th className="p-3">Pelanggan</th>
                  <th className="p-3">Item Pesanan</th>
                  <th className="p-3">Total & Metode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl">Aksi Pesanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada pesanan dengan filter status "{orderFilterStatus}".
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
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
                        {ord.promoCode && (
                          <span className="text-[10px] text-emerald-400 block">
                            Promo: {ord.promoCode} (-Rp {ord.discountAmount.toLocaleString("id-ID")})
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : ord.status === "kitchen_processing"
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : ord.status === "out_for_delivery"
                              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
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
                        <div className="flex flex-wrap items-center gap-1.5">
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
                              onClick={() => handleUpdateOrderStatus(ord.id, "kitchen_processing")}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-[10px] font-bold transition"
                              title="Kirim ke Dapur"
                            >
                              Proses Dapur
                            </button>
                          )}
                          {ord.status === "kitchen_processing" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "out_for_delivery")}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                              title="Serahkan ke Kurir"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Kirim</span>
                            </button>
                          )}
                          {ord.status === "out_for_delivery" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, "completed")}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition"
                              title="Tandai Diterima"
                            >
                              Selesai
                            </button>
                          )}

                          {ord.status !== "cancelled" && (
                            <button
                              onClick={() => handleCancelOrder(ord.id, ord.orderNumber)}
                              className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-[10px] font-semibold transition"
                              title="Batalkan pesanan & kembalikan stok"
                            >
                              <RotateCcw className="w-3 h-3 inline mr-0.5" /> Batal
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setActiveTab("proxy");
                              setProxyOrderId(ord.orderNumber);
                            }}
                            className="px-1.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                            title="Proxy status"
                          >
                            🛡️
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

      {/* ========================================================= */}
      {/* TAB 2: PRODUCTS CRUD & PHOTO MANAGEMENT                   */}
      {/* ========================================================= */}
      {activeTab === "products" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-850 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Katalog Produk & Varian Toko</h3>
              <p className="text-xs text-slate-400">Tambah menu dessert box baru, ubah harga, atau ganti foto produk.</p>
            </div>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* Add Product Modal Form */}
          {isAddProductOpen && (
            <div className="bg-slate-850 p-5 rounded-2xl border border-amber-500/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                <h4 className="font-bold text-sm text-amber-300">Formulir Tambah Dessert Box Baru</h4>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Contoh: Pistachio Kunafa Cream Box"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategori *</label>
                  <select
                    value={newProduct.categoryId}
                    onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cat_choco">Choco Lovers 🍫</option>
                    <option value="cat_cheese">Cheese & Creamy 🧀</option>
                    <option value="cat_coffee">Coffee & Tiramisu ☕</option>
                    <option value="cat_fruity">Fruity Fresh 🍓</option>
                    <option value="cat_hampers">Hampers & Bundling 🎁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Dasar (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={newProduct.basePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, basePrice: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Harga Coret Promosi (Opsional)</label>
                  <input
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                    placeholder="Contoh: 58000"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Varian Utama *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.variantName}
                    onChange={(e) => setNewProduct({ ...newProduct, variantName: e.target.value })}
                    placeholder="Personal Box (350ml)"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stok Awal Produksi *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Deskripsi Lengkap *</label>
                  <textarea
                    rows={2}
                    required
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Komposisi bahan, tekstur sponge, mousse, dan kelezatan dessert..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                  >
                    Simpan Produk ke Database
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Product List Grid */}
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
                        className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-sm"
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
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{p.name}</h4>
                        {p.badge && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{p.shortDesc}</p>
                      <span className="text-xs font-bold text-amber-400 block mt-0.5">
                        Rp {p.basePrice.toLocaleString("id-ID")} • Total Stok: {p.totalStock} box
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <label
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                      title="Unggah foto asli Anda dari perangkat"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {uploadingProductId === p.id ? "Menyimpan..." : "Foto"}
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
                      title="Ubah URL foto"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

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
                        placeholder="/images/products/nama-file.jpg"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                      <button
                        onClick={() => handleSaveCustomImageUrl(p.id)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: STOCK & AUDIT TRAIL LOGS                           */}
      {/* ========================================================= */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          {/* Quick stock editor table */}
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Pengaturan Stok Varian Dapur</h3>
                <p className="text-xs text-slate-400">Peringatan otomatis muncul jika stok &le; 5 box (kritis) atau 0 (habis).</p>
              </div>
              <span className="text-xs text-amber-400 font-semibold">Simpan perubahan langsung ke D1</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="p-2.5 rounded-l-xl">Menu & Varian</th>
                    <th className="p-2.5">Harga Ekstra</th>
                    <th className="p-2.5">Status Ketersediaan</th>
                    <th className="p-2.5">Jumlah Stok Box</th>
                    <th className="p-2.5 rounded-r-xl">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.flatMap((p) =>
                    p.variants.map((v) => {
                      const currentVal = stockEdits[v.id] !== undefined ? stockEdits[v.id] : v.stock;
                      const isLow = currentVal > 0 && currentVal <= 5;
                      const isOut = currentVal === 0;

                      return (
                        <tr key={v.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5">
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-slate-400 text-[11px]">{v.variantName}</span>
                          </td>
                          <td className="p-2.5 font-mono">
                            {v.additionalPrice > 0 ? `+Rp ${v.additionalPrice.toLocaleString("id-ID")}` : "Standar"}
                          </td>
                          <td className="p-2.5">
                            {isOut ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                                HABIS
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                KRITIS (&le;5)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                TERSEDIA
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min={0}
                              value={currentVal}
                              onChange={(e) =>
                                setStockEdits({ ...stockEdits, [v.id]: Math.max(0, parseInt(e.target.value) || 0) })
                              }
                              className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={() => handleSaveVariantStock(v.id)}
                              disabled={isSavingStock === v.id || stockEdits[v.id] === undefined || stockEdits[v.id] === v.stock}
                              className="px-3 py-1.5 bg-amber-500 disabled:opacity-30 disabled:pointer-events-none hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                            >
                              {isSavingStock === v.id ? "Menyimpan..." : "Simpan"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Logs / Audit Trail Table */}
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Riwayat Perubahan Stok (Audit Trail)</h3>
              </div>
              <span className="text-[11px] text-slate-400">Dicatat otomatis dari penjualan, restock & pembatalan</span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 uppercase text-slate-400 tracking-wider sticky top-0">
                  <tr>
                    <th className="p-2.5 rounded-l-xl">Waktu</th>
                    <th className="p-2.5">Produk & Varian</th>
                    <th className="p-2.5">Jenis Aksi</th>
                    <th className="p-2.5">Perubahan</th>
                    <th className="p-2.5">Stok Sebelum &rarr; Sesudah</th>
                    <th className="p-2.5">Referensi</th>
                    <th className="p-2.5 rounded-r-xl">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stockLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">
                        Belum ada riwayat perubahan stok tercatat.
                      </td>
                    </tr>
                  ) : (
                    stockLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="p-2.5">
                          <span className="font-bold text-white block">{log.productName}</span>
                          <span className="text-slate-400 text-[11px]">{log.variantName}</span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.changeType === "sale"
                                ? "bg-rose-500/20 text-rose-300"
                                : log.changeType === "cancellation"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {log.changeType}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold">
                          {log.quantityDelta > 0 ? (
                            <span className="text-emerald-400">+{log.quantityDelta}</span>
                          ) : (
                            <span className="text-rose-400">{log.quantityDelta}</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400">
                          {log.previousStock} &rarr; <span className="text-white font-bold">{log.newStock}</span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-400 text-[11px]">
                          {log.referenceId || "-"}
                        </td>
                        <td className="p-2.5 text-slate-400 text-[11px] max-w-xs truncate">
                          {log.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PROMOTIONS MANAGEMENT                             */}
      {/* ========================================================= */}
      {activeTab === "promos" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-850 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm">Manajemen Kupon Diskon & Voucher Promo</h3>
              <p className="text-xs text-slate-400">Kelola kuota, batas penggunaan per pelanggan, dan periode berlaku.</p>
            </div>
            <button
              onClick={() => setIsAddPromoOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Promo Baru</span>
            </button>
          </div>

          {/* Add Promo Modal */}
          {isAddPromoOpen && (
            <div className="bg-slate-850 p-5 rounded-2xl border border-amber-500/40 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="font-bold text-sm text-amber-300">Formulir Pembuatan Promo Baru</h4>
                <button
                  onClick={() => setIsAddPromoOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode Voucher (Kapital) *</label>
                  <input
                    type="text"
                    required
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase().trim() })}
                    placeholder="Contoh: SWEETWEEKEND"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Judul Promo *</label>
                  <input
                    type="text"
                    required
                    value={newPromo.title}
                    onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                    placeholder="Contoh: Diskon 20% Akhir Pekan"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Jenis Diskon *</label>
                  <select
                    value={newPromo.discountType}
                    onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nilai Diskon ({newPromo.discountType === "percentage" ? "%" : "Rp"}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPromo.discountValue}
                    onChange={(e) => setNewPromo({ ...newPromo, discountValue: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimal Belanja (Rp)</label>
                  <input
                    type="number"
                    value={newPromo.minPurchase}
                    onChange={(e) => setNewPromo({ ...newPromo, minPurchase: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maksimal Diskon (Rp, untuk %)</label>
                  <input
                    type="number"
                    value={newPromo.maxDiscount}
                    onChange={(e) => setNewPromo({ ...newPromo, maxDiscount: Number(e.target.value) })}
                    placeholder="Contoh: 25000"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Kuota Penggunaan *</label>
                  <input
                    type="number"
                    required
                    value={newPromo.quota}
                    onChange={(e) => setNewPromo({ ...newPromo, quota: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maks. Penggunaan per Customer *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPromo.maxUsagePerUser}
                    onChange={(e) => setNewPromo({ ...newPromo, maxUsagePerUser: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Segmen Pelanggan *</label>
                  <select
                    value={newPromo.targetSegment}
                    onChange={(e) => setNewPromo({ ...newPromo, targetSegment: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Semua Pelanggan (Publik)</option>
                    <option value="new">New Customer (Pelanggan Baru / Pertama Kali)</option>
                    <option value="repeat">Repeat Customer (Pernah Order Sebelumnya)</option>
                    <option value="loyal">Loyal Customer (VIP Pelanggan Setia)</option>
                    <option value="inactive">Inactive Customer (Reaktivasi 'Kami Rindu Kamu')</option>
                    <option value="specific_email">Email Pelanggan Tertentu (Eksklusif)</option>
                  </select>
                </div>

                {newPromo.targetSegment === "specific_email" && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Pelanggan Tertentu *</label>
                    <input
                      type="email"
                      required
                      value={newPromo.targetCustomerEmail}
                      onChange={(e) => setNewPromo({ ...newPromo, targetCustomerEmail: e.target.value })}
                      placeholder="contoh: customer@email.com"
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddPromoOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                  >
                    Buat Voucher Promo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Promo Table */}
          <div className="overflow-x-auto bg-slate-850 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Kode Voucher</th>
                  <th className="p-3">Judul & Keterangan</th>
                  <th className="p-3">Diskon</th>
                  <th className="p-3">Min. Belanja</th>
                  <th className="p-3">Kuota / Terpakai</th>
                  <th className="p-3">Target Segmen</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="p-3">
                      <span className="font-mono font-bold text-amber-400 block text-sm">{p.code}</span>
                      <span className="text-[10px] text-slate-400">Max 1x per user</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{p.title}</span>
                      <span className="text-slate-400 text-[11px]">{p.description}</span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-400">
                      {p.discountType === "percentage" ? `${p.discountValue}% (Max Rp ${p.maxDiscount?.toLocaleString("id-ID") || "-"})` : `Rp ${p.discountValue.toLocaleString("id-ID")}`}
                    </td>
                    <td className="p-3 font-mono">
                      Rp {p.minPurchase.toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-white">{p.usedCount}</span>
                      <span className="text-slate-400"> / {p.quota} kupon</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
                          p.targetSegment === "loyal"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : p.targetSegment === "new"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            : p.targetSegment === "repeat"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            : p.targetSegment === "inactive"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : p.targetSegment === "specific_email"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {p.targetSegment === "loyal"
                          ? "VIP Loyal"
                          : p.targetSegment === "new"
                          ? "New User"
                          : p.targetSegment === "repeat"
                          ? "Repeat"
                          : p.targetSegment === "inactive"
                          ? "Reaktivasi"
                          : p.targetSegment === "specific_email"
                          ? `Khusus Email`
                          : "Semua User"}
                      </span>
                      {p.targetCustomerEmail && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px] font-mono mt-0.5">
                          {p.targetCustomerEmail}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.isActive === 1
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {p.isActive === 1 ? "AKTIF" : "NON-AKTIF"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleTogglePromo(p.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                          p.isActive === 1
                            ? "bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800"
                            : "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {p.isActive === 1 ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: CRM & RETENSI PELANGGAN                            */}
      {/* ========================================================= */}
      {activeTab === "crm" && (
        <div className="space-y-6">
          {/* Segment KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => setCrmFilterSegment("New Customer")}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                crmFilterSegment === "New Customer"
                  ? "bg-blue-950/60 border-blue-500"
                  : "bg-slate-850 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <span className="text-xs font-bold uppercase">New Customers</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-white">
                {customers.filter((c) => c.segment === "New Customer").length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Order perdana / pengguna baru</p>
            </div>

            <div
              onClick={() => setCrmFilterSegment("Repeat Customer")}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                crmFilterSegment === "Repeat Customer"
                  ? "bg-purple-950/60 border-purple-500"
                  : "bg-slate-850 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between text-purple-400 mb-1">
                <span className="text-xs font-bold uppercase">Repeat Customers</span>
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-white">
                {customers.filter((c) => c.segment === "Repeat Customer").length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">2-4 kali transaksi aktif</p>
            </div>

            <div
              onClick={() => setCrmFilterSegment("Loyal Customer")}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                crmFilterSegment === "Loyal Customer"
                  ? "bg-amber-950/60 border-amber-500"
                  : "bg-slate-850 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between text-amber-400 mb-1">
                <span className="text-xs font-bold uppercase">Loyal Customers</span>
                <Award className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-white">
                {customers.filter((c) => c.segment === "Loyal Customer").length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">&ge;5 pesanan / LTV &ge;Rp 500k</p>
            </div>

            <div
              onClick={() => setCrmFilterSegment("Inactive Customer")}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                crmFilterSegment === "Inactive Customer"
                  ? "bg-rose-950/60 border-rose-500"
                  : "bg-slate-850 border-slate-700/60 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between text-rose-400 mb-1">
                <span className="text-xs font-bold uppercase">Inactive Customers</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-2xl font-black text-white">
                {customers.filter((c) => c.segment === "Inactive Customer").length}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">&gt;30 hari tidak belanja ulang</p>
            </div>
          </div>

          {/* CRM Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-850 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={crmSearch}
                onChange={(e) => setCrmSearch(e.target.value)}
                placeholder="Cari nama, email atau WhatsApp pelanggan..."
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 w-full sm:w-72"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Filter Segmen:</span>
              <button
                onClick={() => setCrmFilterSegment("all")}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  crmFilterSegment === "all" ? "bg-purple-600 text-white font-bold" : "bg-slate-800 text-slate-400"
                }`}
              >
                Semua ({customers.length})
              </button>
            </div>
          </div>

          {/* Customer CRM Table */}
          <div className="overflow-x-auto bg-slate-850 rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Profil Pelanggan</th>
                  <th className="p-3">Total Belanja (LTV)</th>
                  <th className="p-3">Frekuensi Order</th>
                  <th className="p-3">Rata-rata Order (AOV)</th>
                  <th className="p-3">Terakhir Belanja</th>
                  <th className="p-3">Segmen CRM</th>
                  <th className="p-3 rounded-r-xl">Tindakan Retensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Tidak ada data pelanggan yang sesuai dengan pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.email} className="hover:bg-slate-800/40">
                      <td className="p-3">
                        <span className="font-bold text-white block">{cust.name}</span>
                        <span className="text-[11px] text-slate-400 block">{cust.email}</span>
                        {cust.phone && <span className="text-[10px] text-slate-500 font-mono">{cust.phone}</span>}
                      </td>

                      <td className="p-3 font-bold text-emerald-400 font-mono">
                        Rp {cust.totalSpent.toLocaleString("id-ID")}
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-white block">{cust.totalOrders} Transaksi</span>
                        <span className="text-[10px] text-slate-400">Verifikasi Lunas</span>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        Rp {cust.averageOrderValue.toLocaleString("id-ID")}
                      </td>

                      <td className="p-3 text-[11px] text-slate-400">
                        {cust.lastOrderDate
                          ? new Date(cust.lastOrderDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Belum pernah"}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            cust.segment === "Loyal Customer"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : cust.segment === "Repeat Customer"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : cust.segment === "Inactive Customer"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {cust.segment}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1.5 items-start">
                          {cust.segment === "Inactive Customer" && (
                            <button
                              onClick={() => handleSendRetentionAction(cust, "KANGEN15", "winback_offer")}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                              title="Kirim voucher 15% untuk mengajak belanja kembali"
                            >
                              <Send className="w-3 h-3" />
                              <span>Voucher Kangen 15%</span>
                            </button>
                          )}

                          {cust.segment === "Loyal Customer" && (
                            <button
                              onClick={() => handleSendRetentionAction(cust, "VIPREWARD", "loyalty_voucher")}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                              title="Kirim voucher apresiasi loyalitas VIP"
                            >
                              <Award className="w-3 h-3" />
                              <span>Apresiasi VIP (20%)</span>
                            </button>
                          )}

                          {cust.segment === "Repeat Customer" && (
                            <button
                              onClick={() => handleSendRetentionAction(cust, "DESSERT10K", "reorder_nudge")}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                              title="Kirim voucher potongan Rp 10.000"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Kupon Treat 10k</span>
                            </button>
                          )}

                          {cust.segment === "New Customer" && (
                            <button
                              onClick={() => handleSendRetentionAction(cust, "MANIS20", "welcome_nudge")}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                              title="Kirim voucher selamat datang 20%"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Voucher Baru 20%</span>
                            </button>
                          )}

                          {/* Buat Promo Khusus Pelanggan Ini */}
                          <button
                            onClick={() => {
                              const cleanName = (cust.name || "CUST").split(" ")[0].replace(/[^A-Za-z]/g, "").toUpperCase();
                              const codeSuggestion = `${cleanName}${cust.segment === "Loyal Customer" ? "VIP" : "SPECIAL"}${Math.floor(10 + Math.random() * 90)}`;
                              setNewPromo({
                                code: codeSuggestion,
                                title: `Spesial Reward untuk ${cust.name}`,
                                description: `Voucher promo eksklusif untuk ${cust.email}`,
                                discountType: "percentage",
                                discountValue: cust.segment === "Loyal Customer" ? 25 : 20,
                                minPurchase: 50000,
                                maxDiscount: 35000,
                                quota: 1,
                                maxUsagePerUser: 1,
                                targetSegment: "specific_email",
                                targetCustomerEmail: cust.email,
                              });
                              setActiveTab("promos");
                              setIsAddPromoOpen(true);
                            }}
                            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white rounded border border-slate-700 text-[10px] font-semibold transition flex items-center gap-1"
                            title="Buat promo kupon khusus untuk email pelanggan ini"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Buat Promo Khusus</span>
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

      {/* ========================================================= */}
      {/* TAB 6: PROXY & MIDTRANS TOOLS                             */}
      {/* ========================================================= */}
      {activeTab === "proxy" && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 flex items-start gap-3">
            <div className="p-2 bg-purple-900/80 rounded-xl text-purple-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-purple-200">
                🛡️ Modul Proxy Server & Midtrans API Status
              </h4>
              <p className="text-purple-300/90 leading-relaxed">
                Menjaga agar Server Key Midtrans tidak pernah terekspos ke sisi publik / browser frontend. Seluruh verifikasi status transaksi dan pembatalan diproses secara aman melalui backend edge serverless.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tool 1 */}
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700/60 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-400" />
                <span>Cek Status Transaksi Midtrans via Proxy</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proxyOrderId}
                  onChange={(e) => setProxyOrderId(e.target.value)}
                  placeholder="Masukkan Nomor Order (DB-...)"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (!proxyOrderId) return;
                    setProxyLoading(true);
                    authFetch("/api/proxy/midtrans/status", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderId: proxyOrderId.trim() }),
                    })
                      .then((r) => r.json())
                      .then((d) => setProxyResult(d))
                      .finally(() => setProxyLoading(false));
                  }}
                  disabled={proxyLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs"
                >
                  {proxyLoading ? "Memeriksa..." : "Cek Status"}
                </button>
              </div>

              {proxyResult && (
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-40 border border-slate-800">
                  {JSON.stringify(proxyResult, null, 2)}
                </pre>
              )}
            </div>

            {/* Tool 2 */}
            <div className="p-5 rounded-2xl bg-slate-850 border border-slate-700/60 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span>Tester Outbound Safe Proxy (/api/proxy/fetch)</span>
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proxyCustomUrl}
                  onChange={(e) => setProxyCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => {
                    if (!proxyCustomUrl) return;
                    setProxyFetchLoading(true);
                    authFetch("/api/proxy/fetch", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: proxyCustomUrl.trim() }),
                    })
                      .then((r) => r.json())
                      .then((d) => setProxyFetchResult(d))
                      .finally(() => setProxyFetchLoading(false));
                  }}
                  disabled={proxyFetchLoading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs"
                >
                  {proxyFetchLoading ? "Testing..." : "Test Proxy"}
                </button>
              </div>

              {proxyFetchResult && (
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[10px] text-cyan-400 overflow-x-auto max-h-40 border border-slate-800">
                  {JSON.stringify(proxyFetchResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
