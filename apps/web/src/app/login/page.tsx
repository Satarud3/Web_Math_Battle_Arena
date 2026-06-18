"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock authentication success
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative">
      {/* Glow effect */}
      <div className="absolute w-72 h-72 bg-primary/15 blur-3xl rounded-full -top-10 -left-10 -z-10"></div>
      <div className="absolute w-72 h-72 bg-secondary/15 blur-3xl rounded-full -bottom-10 -right-10 -z-10"></div>

      <div className="max-w-md w-full bg-card border border-primary/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            MATH BATTLE ARENA
          </Link>
          <h2 className="text-xl font-bold mt-4 text-white">Selamat Datang Kembali</h2>
          <p className="text-sm text-text-muted mt-1">Masuk untuk melanjutkan ke arena pertarungan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Alamat Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com" 
              required
              className="w-full h-12 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">Kata Sandi</label>
              <a href="#" className="text-xs text-primary hover:underline">Lupa Sandi?</a>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full h-12 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center hover:opacity-90 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 transition-all cursor-pointer text-sm"
          >
            {loading ? "Memproses..." : "Masuk ke Akun"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted">
          Belum punya akun?{" "}
          <Link href="/register" className="text-secondary hover:underline font-medium">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
