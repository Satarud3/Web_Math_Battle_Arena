"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert, User } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import MathBackground from "@/components/ui/MathBackground";
import PageTransition from "@/components/PageTransition";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      setLoading(false);
      return;
    }

    try {
      await api.post("/auth/register", { name, username, email, password, confirmPassword });
      setSuccess("Registrasi berhasil. Mengarahkan ke halaman masuk...");
      setTimeout(() => router.push("/login"), 2000);
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
          className="glass-card w-full max-w-md rounded-3xl p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)] neon-glow-purple"
        >
          <div className="mb-8 text-center">
            <Link href="/" className="font-heading text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              MATH BATTLE ARENA
            </Link>
            <h1 className="mt-5 text-2xl font-black text-white font-heading">CREATE YOUR ARENA ID</h1>
            <p className="mt-2 text-sm text-text-muted">Buat akun Anda untuk mulai bertarung di arena.</p>
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

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-neon-green/30 bg-neon-green/10 p-3 text-sm font-medium text-neon-green"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budi Santoso" required className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-11 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-purple focus:shadow-[0_0_12px_rgba(176,38,255,0.15)] focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Username Unik</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="budi_math" required className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-4 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-purple focus:shadow-[0_0_12px_rgba(176,38,255,0.15)] focus:outline-none" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="budi@email.com" required className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-11 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-purple focus:shadow-[0_0_12px_rgba(176,38,255,0.15)] focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Kata Sandi (Min 6 karakter)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-11 pr-12 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-purple focus:shadow-[0_0_12px_rgba(176,38,255,0.15)] focus:outline-none" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Konfirmasi Kata Sandi</label>
              <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" required className="h-11 w-full rounded-xl border border-white/10 bg-bg-surface/60 px-4 text-sm text-white placeholder-text-muted/50 transition-all focus:border-neon-purple focus:shadow-[0_0_12px_rgba(176,38,255,0.15)] focus:outline-none" />
            </div>

            <button type="submit" disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-neon-purple to-neon-blue text-sm font-black text-white transition-all hover:shadow-[0_0_28px_rgba(176,38,255,0.3)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
              {loading ? "Memproses pendaftaran..." : "Buat Arena ID"}
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
            onClick={() => window.location.href = "http://localhost:4000/auth/google"}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-bg-surface/40 hover:bg-bg-surface/80 hover:border-white/20 text-sm font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="mt-8 text-center text-sm text-text-muted">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-neon-blue hover:underline">
              Masuk Sekarang
            </Link>
          </div>
        </motion.div>
      </PageTransition>
    </div>
  );
}
