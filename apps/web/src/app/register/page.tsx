"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldAlert, User } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import MathBackground from "@/components/ui/MathBackground";

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
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <div className="glass-panel w-full max-w-md rounded-3xl border border-border-soft bg-bg-glass p-8 shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="mb-8 text-center">
          <Link href="/" className="font-arena text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-purple">
            MATH BATTLE ARENA
          </Link>
          <h1 className="mt-5 text-2xl font-black text-white">CREATE YOUR ARENA ID</h1>
          <p className="mt-2 text-sm text-text-muted">Buat akun Anda untuk mulai bertarung di arena.</p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm font-medium text-red-200">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-success/30 bg-success/10 p-3 text-sm font-medium text-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budi Santoso" required className="h-11 w-full rounded-xl border border-primary/20 bg-bg-deep/70 px-11 text-sm text-white placeholder-text-muted/50 transition-colors focus:border-neon-cyan focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Username Unik</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="budi_math" required className="h-11 w-full rounded-xl border border-primary/20 bg-bg-deep/70 px-4 text-sm text-white placeholder-text-muted/50 transition-colors focus:border-neon-cyan focus:outline-none" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="budi@email.com" required className="h-11 w-full rounded-xl border border-primary/20 bg-bg-deep/70 px-11 text-sm text-white placeholder-text-muted/50 transition-colors focus:border-neon-cyan focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Kata Sandi (Min 6 karakter)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="h-11 w-full rounded-xl border border-primary/20 bg-bg-deep/70 px-11 pr-12 text-sm text-white placeholder-text-muted/50 transition-colors focus:border-neon-cyan focus:outline-none" />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-text-muted">Konfirmasi Kata Sandi</label>
            <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password" required className="h-11 w-full rounded-xl border border-primary/20 bg-bg-deep/70 px-4 text-sm text-white placeholder-text-muted/50 transition-colors focus:border-neon-cyan focus:outline-none" />
          </div>

          <button type="submit" disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple text-sm font-black text-white transition-all hover:shadow-[0_0_28px_rgba(6,182,212,0.35)] disabled:opacity-50">
            {loading ? "Memproses pendaftaran..." : "Buat Arena ID"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
