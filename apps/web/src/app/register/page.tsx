"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import api from "@/lib/api";
import { AxiosError } from "axios";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      await api.post("/auth/register", {
        name,
        username,
        email,
        password,
        confirmPassword,
      });

      setSuccess("Registrasi berhasil! Mengarahkan ke halaman masuk...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data;
        if (Array.isArray(data.message)) {
          setError(data.message[0]);
        } else {
          setError(data.message || "Terjadi kesalahan saat mendaftar");
        }
      } else {
        setError("Koneksi server gagal");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Glow effect */}
      <div className="absolute w-72 h-72 bg-primary/15 blur-3xl rounded-full -top-10 -left-10 -z-10"></div>
      <div className="absolute w-72 h-72 bg-secondary/15 blur-3xl rounded-full -bottom-10 -right-10 -z-10"></div>

      <div className="max-w-md w-full bg-card border border-primary/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            MATH BATTLE ARENA
          </Link>
          <h2 className="text-xl font-bold mt-4 text-white">Daftar Akun Baru</h2>
          <p className="text-sm text-text-muted mt-1">Buat akun Anda untuk mulai bertarung di arena.</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm font-medium">
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Nama Lengkap</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Santoso" 
              required
              className="w-full h-11 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Username Unik</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="budi_math" 
              required
              className="w-full h-11 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Alamat Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@email.com" 
              required
              className="w-full h-11 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Kata Sandi (Min 6 karakter)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full h-11 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Konfirmasi Kata Sandi</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full h-11 px-4 rounded-lg bg-background border border-primary/20 text-white placeholder-text-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-semibold flex items-center justify-center hover:opacity-90 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 transition-all cursor-pointer text-sm mt-6"
          >
            {loading ? "Memproses Pendaftaran..." : "Daftar Akun Baru"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-muted">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Masuk Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
