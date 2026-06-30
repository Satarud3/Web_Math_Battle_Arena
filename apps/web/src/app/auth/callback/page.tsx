"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import MathBackground from "@/components/ui/MathBackground";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.push("/login?error=Token tidak ditemukan");
      return;
    }

    // Save token into client-side cookie so that Axios withCredentials: true can send it
    document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax;`;

    // Fetch the logged-in user profile using the HttpOnly cookie that was just set
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const { user } = response.data;
        setUser(user);

        if (user.role === "ADMIN" || user.role === "MODERATOR") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Gagal mengambil data profil Google", err);
        router.push("/login?error=Gagal mengautentikasi akun Google");
      }
    };

    fetchUser();
  }, [searchParams, router, setUser]);

  return (
    <div className="flex flex-col items-center gap-4 z-10">
      <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
      <h1 className="text-xl font-black text-white font-heading tracking-widest animate-pulse">
        MENGOTENTIKASI CHALLENGER...
      </h1>
      <p className="text-slate-400 text-sm font-medium font-ui">
        Menghubungkan dengan sistem otentikasi siber Google.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="relative min-h-[100dvh] bg-bg-main text-white flex flex-col justify-center items-center overflow-hidden">
      <MathBackground />
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4 z-10">
          <Loader2 className="w-12 h-12 text-neon-purple animate-spin" />
          <h1 className="text-xl font-black text-white font-heading tracking-widest animate-pulse">
            MEMUAT MODUL CALLBACK...
          </h1>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
