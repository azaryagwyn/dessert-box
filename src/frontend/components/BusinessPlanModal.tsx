import React, { useState } from "react";
import {
  X,
  Briefcase,
  Users,
  Layers,
  Truck,
  CreditCard,
  DollarSign,
  HeartHandshake,
  Cpu,
  ShieldCheck,
  Award,
  TrendingUp,
  FileText,
  Boxes,
  Zap,
} from "lucide-react";

interface BusinessPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessPlanModal: React.FC<BusinessPlanModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"bmc" | "economics" | "infra" | "crm">("bmc");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-['Playfair_Display',serif] text-xl font-bold text-white">
                  Rencana Bisnis & Business Model Canvas (BMC)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SweetLayers Jakarta
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dokumentasi Strategi Bisnis, Unit Economics, Arsitektur Sistem & CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab("bmc")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "bmc"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Business Model Canvas (9 Blok)</span>
          </button>

          <button
            onClick={() => setActiveTab("economics")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "economics"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Unit Economics & Revenue Streams</span>
          </button>

          <button
            onClick={() => setActiveTab("infra")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "infra"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Infrastruktur Cloud & Keamanan</span>
          </button>

          <button
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "crm"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Segmentasi CRM & Retensi Pelanggan</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BUSINESS MODEL CANVAS (9 BLOCKS) */}
          {activeTab === "bmc" && (
            <div className="space-y-6">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200/90 leading-relaxed">
                <strong>Model Bisnis Digital SweetLayers:</strong> Dikelola sebagai brand D2C (Direct-to-Consumer) Artisan Dessert Box premium di Jabodetabek yang menggabungkan kemudahan pemesanan via e-commerce berbasis Cloudflare Edge, gerbang pembayaran Midtrans QRIS, dan jaminan kesegaran rantai dingin (cold-chain guarantee).
              </div>

              {/* 9 Blocks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Key Partners */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <HeartHandshake className="w-4 h-4" />
                    <span>1. Key Partners</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Importir Cokelat Dark Belgia (Callebaut Grade)</li>
                    <li>Petani Buah Stroberi Segar Ciwidey & Lembang</li>
                    <li>Payment Gateway Midtrans (QRIS, VA Bank)</li>
                    <li>Kurir Instan Logistik (GoSend, GrabExpress)</li>
                    <li>Produsen Kemasan Food-Grade & Ice Gel Pack</li>
                  </ul>
                </div>

                {/* 2. Key Activities */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Zap className="w-4 h-4" />
                    <span>2. Key Activities</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Baking harian (fresh daily baked) tanpa pengawet</li>
                    <li>Kontrol suhu rantai dingin chiller 2-6°C</li>
                    <li>Perakitan hampers kustom (pita satin, lilin, kartu ucapan)</li>
                    <li>Pengembangan & pemeliharaan e-commerce edge</li>
                    <li>Customer relationship management & automasi promo</li>
                  </ul>
                </div>

                {/* 3. Value Propositions */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Award className="w-4 h-4" />
                    <span>3. Value Propositions</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>100% Cokelat Belgia & Mascarpone lembut tanpa enek</li>
                    <li>Garansi Dingin Sampai Tempat dengan ice gel bersegel</li>
                    <li>Pengiriman cepat 1-2 jam di seluruh Jabodetabek</li>
                    <li>Personalized Gifting: Kartu ucapan, lilin, hardbox mewah</li>
                    <li>Checkout transparan & verifikasi pembayaran real-time</li>
                  </ul>
                </div>

                {/* 4. Customer Relationships */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-pink-400 font-bold">
                    <Users className="w-4 h-4" />
                    <span>4. Customer Relationships</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Customer care WhatsApp responsif & ramah</li>
                    <li>Program Reward Loyalty untuk Repeat Customer</li>
                    <li>Voucher Re-aktivasi otomatis untuk Inactive Customer</li>
                    <li>Garansi ganti baru 100% jika produk rusak di kurir</li>
                  </ul>
                </div>

                {/* 5. Customer Segments */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold">
                    <Users className="w-4 h-4" />
                    <span>5. Customer Segments</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Pencinta dessert & makanan manis usia 18-35 tahun</li>
                    <li>Pemberi kado ulang tahun, wisuda & hampers hari raya</li>
                    <li>Pekerja kantoran Jabodetabek (camilan rapat/self reward)</li>
                    <li>Keluarga untuk sajian sharing weekend & gathering</li>
                  </ul>
                </div>

                {/* 6. Key Resources */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Boxes className="w-4 h-4" />
                    <span>6. Key Resources</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Dapur sentral higienis berstandar sanitasi ketat</li>
                    <li>Chiller penyimpanan industri terkontrol</li>
                    <li>Infrastruktur Cloudflare Pages + Edge Serverless + D1</li>
                    <li>Formulasi resep eksklusif pastry chef tersertifikasi</li>
                  </ul>
                </div>

                {/* 7. Channels */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Truck className="w-4 h-4" />
                    <span>7. Channels</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Website E-Commerce Resmi (https://ecommerce.sweetlayers.my.id)</li>
                    <li>Katalog Media Sosial: Instagram & TikTok @sweetlayers.id</li>
                    <li>Integrasi Kurir Instan Jabodetabek (GoSend & Grab)</li>
                    <li>Geotagging & Local SEO Google Maps</li>
                  </ul>
                </div>

                {/* 8. Cost Structure */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-orange-400 font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span>8. Cost Structure</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Bahan Baku Premium (Kakao Belgia, butter, keju) ~40%</li>
                    <li>Kemasan Hardbox & Ice Gel Pendingin ~15%</li>
                    <li>Operasional Dapur, Listrik Chiller & Tenaga Kerja ~18%</li>
                    <li>Marketing Digital & Diskon Voucher ~12%</li>
                    <li>Payment Gateway (Midtrans 0.7%) & Cloud Hosting ~3%</li>
                  </ul>
                </div>

                {/* 9. Revenue Streams */}
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>9. Revenue Streams</span>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1.5 leading-relaxed">
                    <li>Penjualan Box Personal (350ml): Rp 38.000 - Rp 54.000</li>
                    <li>Penjualan Sharing Family Box (500ml): +Rp 20.000</li>
                    <li>Penjualan Paket Hampers Mewah (Grand Festive): Rp 185.000</li>
                    <li>Add-on Tambahan (Topper akrilik, lilin, kartu ucapan custom)</li>
                    <li>Biaya Pengiriman Flat-rate Kurir Instan</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UNIT ECONOMICS */}
          {activeTab === "economics" && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700">
                  <span className="text-slate-400 font-medium block mb-1">Rata-rata Harga Jual (AOV)</span>
                  <span className="text-xl font-bold text-white">Rp 52.000</span>
                  <span className="text-[11px] text-emerald-400 block mt-1">Per Box Dessert</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700">
                  <span className="text-slate-400 font-medium block mb-1">HPP Bahan Baku (COGS)</span>
                  <span className="text-xl font-bold text-amber-400">Rp 20.800</span>
                  <span className="text-[11px] text-slate-400 block mt-1">40% dari harga jual</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700">
                  <span className="text-slate-400 font-medium block mb-1">Kemasan & Insulasi Dingin</span>
                  <span className="text-xl font-bold text-orange-400">Rp 7.800</span>
                  <span className="text-[11px] text-slate-400 block mt-1">15% Box + Ice Gel</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-850 border border-slate-700">
                  <span className="text-slate-400 font-medium block mb-1">Laba Kotor Bersih (Contribution)</span>
                  <span className="text-xl font-bold text-emerald-400">Rp 23.400</span>
                  <span className="text-[11px] text-emerald-400 block mt-1">45% Margin Kontribusi</span>
                </div>
              </div>

              {/* Cost Breakdown Table */}
              <div className="bg-slate-850 rounded-2xl border border-slate-700 p-5 space-y-3">
                <h3 className="font-bold text-white text-sm">Simulasi Unit Economics: Belgian Dark Choco Melt Box (Rp 48.000)</h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span>1. Dark Chocolate Belgia, Susu UHT, Butter & Tepung</span>
                    <span className="font-mono text-slate-200">Rp 19.200 (40.0%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span>2. Wadah Food-Grade Klir + Segel Safety Seal + Sendok Kayu</span>
                    <span className="font-mono text-slate-200">Rp 4.800 (10.0%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span>3. Ice Gel Pack Pendingin Rantai Dingin</span>
                    <span className="font-mono text-slate-200">Rp 2.400 (5.0%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span>4. Biaya Tenaga Pastry Chef & Utilitas Listrik Chiller</span>
                    <span className="font-mono text-slate-200">Rp 7.200 (15.0%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800">
                    <span>5. Gateway Midtrans QRIS (0.7%) + Cloud Hosting Edge</span>
                    <span className="font-mono text-slate-200">Rp 1.440 (3.0%)</span>
                  </div>
                  <div className="flex justify-between py-2 font-bold text-emerald-400 text-sm">
                    <span>Target Laba Bersih Operasional per Box</span>
                    <span className="font-mono">Rp 12.960 (27.0%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INFRASTRUCTURE & SECURITY */}
          {activeTab === "infra" && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-850 rounded-2xl border border-slate-700 p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
                  <Cpu className="w-5 h-5" />
                  <span>Arsitektur Infrastruktur E-Commerce Cloud</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white text-xs">A. Frontend & Hosting SaaS/IaaS</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                      <li>Hosting: <strong>Cloudflare Pages</strong> (Edge CDN Global)</li>
                      <li>Framework: <strong>React 19 + TypeScript + Vite</strong></li>
                      <li>Domain Publik: <code className="text-amber-300 font-mono">https://ecommerce.sweetlayers.my.id/</code></li>
                      <li>Protokol: <strong>Full SSL/TLS (HTTPS) + HTTP/3</strong></li>
                    </ul>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="font-bold text-white text-xs">B. Backend Serverless & Database</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 leading-relaxed">
                      <li>Backend Runtime: <strong>Cloudflare Pages Functions</strong> (Hono v4)</li>
                      <li>Database: <strong>Cloudflare D1 (Distributed SQLite)</strong></li>
                      <li>ORM: <strong>Drizzle ORM</strong> with Parameterized Prepared Statements</li>
                      <li>Database Binding: <code className="text-amber-300 font-mono">DB (e0cea204-e02a-4e42-b958-c002c37483bc)</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Security Checklist */}
              <div className="bg-slate-850 rounded-2xl border border-slate-700 p-5 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Implementasi Standar Keamanan E-Commerce</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">✓ Anti Price-Tampering</span>
                    <p className="text-[11px] text-slate-400">Total belanja dan potongan diskon promo dihitung ulang secara mutlak di backend server.</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">✓ Role-Based Authorization</span>
                    <p className="text-[11px] text-slate-400">Endpoint /api/admin/* dikunci ketat menggunakan JWT HS256 dengan hak akses role Admin.</p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">✓ Anti-Overselling & Idempotency</span>
                    <p className="text-[11px] text-slate-400">Pengurangan stok bersifat atomic dan webhook pembayaran dicek berstatus idempotensi ganda.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CRM & RETENTION */}
          {activeTab === "crm" && (
            <div className="space-y-6 text-xs">
              <div className="bg-slate-850 rounded-2xl border border-slate-700 p-5 space-y-3">
                <h3 className="font-bold text-white text-sm">Metodologi Segmentasi Pelanggan Otomatis (Data-Driven CRM)</h3>
                <p className="text-slate-400 leading-relaxed">
                  Modul CRM SweetLayers tidak berdiri sendiri sebagai CRUD manual, melainkan secara otomatis mengagregasi data transaksi nyata di database untuk mengklasifikasikan pelanggan ke dalam empat segmen strategis:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-blue-500/30">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">New Customer</span>
                    <p className="text-slate-300 text-[11px] mt-2">Pelanggan dengan 1 transaksi terverifikasi atau akun baru terdaftar.</p>
                    <span className="text-blue-400 font-semibold text-[10px] block mt-1">Aksi: Welcome Voucher 20%</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-purple-500/30">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">Repeat Customer</span>
                    <p className="text-slate-300 text-[11px] mt-2">Pelanggan yang telah belanja 2-4 kali dan aktif dalam 30 hari terakhir.</p>
                    <span className="text-purple-400 font-semibold text-[10px] block mt-1">Aksi: Weekend Treat Promo Rp 10k</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/30">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">Loyal Customer</span>
                    <p className="text-slate-300 text-[11px] mt-2">Pelanggan dengan frekuensi &ge;5 pesanan atau total belanja &ge;Rp 500.000.</p>
                    <span className="text-amber-400 font-semibold text-[10px] block mt-1">Aksi: VIP Exclusive Hamper Voucher</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/30">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">Inactive Customer</span>
                    <p className="text-slate-300 text-[11px] mt-2">Pelanggan yang tidak melakukan pesanan ulang dalam &gt;30 hari terakhir.</p>
                    <span className="text-rose-400 font-semibold text-[10px] block mt-1">Aksi: Winback Promo "Kangen Manis"</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>SweetLayers E-Commerce System • Verifikasi Kompetensi Akademik Lengkap</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Tutup Dokumen
          </button>
        </div>
      </div>
    </div>
  );
};
