import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const res = await login(loginEmail, loginPassword);
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || "Email atau password tidak sesuai.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);
    const res = await register({
      name: regName,
      email: regEmail,
      phone: regPhone,
      password: regPassword,
    });
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.message || "Gagal membuat akun.");
    }
  };

  const fillAdminAccount = () => {
    setAuthModalMode("login");
    setErrorMessage("");
    setLoginEmail("admin@sweetlayers.com");
    setLoginPassword("AdminSweetLayers2026!");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-6 text-white text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 backdrop-blur-md">
            <span className="text-2xl">🍰</span>
          </div>
          <h2 className="text-xl font-bold">SweetLayers Account</h2>
          <p className="text-xs text-white/90 mt-1">
            Daftar akun customer baru atau masuk untuk lacak pesanan
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("login");
              setErrorMessage("");
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
              authModalMode === "login"
                ? "border-pink-500 text-pink-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Masuk / Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode("register");
              setErrorMessage("");
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${
              authModalMode === "register"
                ? "border-pink-500 text-pink-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        <div className="p-6">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Admin Demo Fill */}
          <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-600 flex items-center gap-1">
              <span>👑</span> Akun Khusus Pengelola / Admin:
            </span>
            <button
              type="button"
              onClick={fillAdminAccount}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:border-purple-400 hover:bg-purple-50 text-purple-700 rounded-lg font-medium transition text-[11px]"
            >
              Isi Akun Admin (1-Klik)
            </button>
          </div>

          {/* LOGIN FORM */}
          {authModalMode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email atau Username
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Contoh: budi atau budi@mail.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showPassword ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-pink-500/20 hover:from-pink-600 hover:to-rose-600 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Memproses Masuk...</span>
                  </>
                ) : (
                  <span>Masuk Sekarang</span>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authModalMode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-0.5">
                  Email atau Username Unik
                </label>
                <p className="text-[10px] text-gray-400 mb-1">
                  Bebas, tidak wajib email asli (bisa username apa saja, contoh: budi123, budi@mail, dsb)
                </p>
                <input
                  type="text"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Masukkan email atau username unik"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor WhatsApp (Opsional)</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kata Sandi</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Kata Sandi</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl text-sm shadow-md shadow-pink-500/20 hover:from-pink-600 hover:to-rose-600 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <span>Buat Akun Sekarang</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
