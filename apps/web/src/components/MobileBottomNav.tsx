"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, Swords, Trophy, User } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Latihan", href: "/practice", icon: Dumbbell },
    { name: "Duel", href: "/duel", icon: Swords },
    { name: "Peringkat", href: "/leaderboard", icon: Trophy },
    { name: "Profil", href: "/profile", icon: User },
  ];

  // Do not show on auth pages or landing page (only dashboard routes)
  const isDashboardRoute = pathname?.startsWith("/dashboard") || 
                           pathname?.startsWith("/practice") || 
                           pathname?.startsWith("/duel") || 
                           pathname?.startsWith("/arena") || 
                           pathname?.startsWith("/leaderboard") || 
                           pathname?.startsWith("/profile");

  if (!isDashboardRoute) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card border-t border-primary/20 md:hidden pb-[env(safe-area-inset-bottom,16px)]">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? "text-neon-blue" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-indicator"
                  className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-neon-blue shadow-[0_0_10px_#00F0FF]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_5px_#00F0FF]" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
