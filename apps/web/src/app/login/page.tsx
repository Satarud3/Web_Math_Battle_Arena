"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/lib/errors";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { user } = response.data;
      setUser(user);

      if (user.role === "ADMIN" || user.role === "MODERATOR") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Koneksi server gagal"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <MathBackground />
      <PageTransition className="flex flex-col items-center w-full">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-neon-blue">
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card w-full max-w-md rounded-3xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)] neon-glow-blue"
        >
          <div className="mb-8 text-center">
            <Link href="/" className="font-heading text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              MATH BATTLE ARENA
            </Link>
            <h1 className="mt-5 text-2xl font-black text-white font-heading">WELCOME BACK, CHALLENGER</h1>
            <p className="mt-2 text-sm text-text-muted">Masuk untuk melanjutkan ke arena pertarungan.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-red-200"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-11 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,240,255,0.15)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Kata Sandi</label>
                <a href="#" className="text-xs text-neon-blue hover:underline">Lupa Sandi?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-11 pr-12 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-blue focus:shadow-[0_0_12px_rgba(0,240,255,0.15)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-sm font-black text-white transition-all hover:shadow-[0_0_28px_rgba(0,240,255,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Memproses masuk..." : "Masuk ke Arena"}
            </button>
          </form>

          {/* Google Sign In Divider */}
          <div className="my-6 flex items-center justify-between text-xs text-text-muted/50">
            <span className="h-[1px] w-[30%] bg-white/10" />
            <span className="uppercase tracking-wider font-semibold">atau masuk dengan</span>
            <span className="h-[1px] w-[30%] bg-white/10" />
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={() => window.location.href = "http://localhost:4000/api/auth/google"}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-bg-surface/40 hover:bg-bg-surface/80 hover:border-white/20 text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.1C18.281 1.256 15.426 0 12.24 0 5.58 0 0 5.37 0 12s5.58 12 12.24 12c6.96 0 11.57-4.839 11.57-11.785 0-.79-.085-1.393-.189-1.93H12.24z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="mt-8 text-center text-sm text-text-muted">
            Belum punya akun?{" "}
            <Link href="/register" className="font-medium text-neon-purple hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </motion.div>
      </PageTransition>
    </div>
  );
}
