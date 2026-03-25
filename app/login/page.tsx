"use client";

/* Clean layout and fixed syntax */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Lock, Mail, ArrowRight, ShieldCheck,
  Globe, Zap,
  Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Terminal component to simulate tech environment
const Terminal = () => {
  const [lines, setLines] = useState<string[]>([
    "BOOTING SYSTEM KERNEL v8.2.4...",
    "NODE_ID: 7FORGE-SOC-NORTH-01",
    "DECRYPTION_MODULE: LOADED",
    "CORE_STABILITY: 99.99%",
  ]);
  
  useEffect(() => {
    const techLines = [
      "INITIALIZING_CORE_HANDSHAKE...",
      "ESTABLISHING_ENCRYPTED_TUNNEL...",
      "VERIFYING_REGISTRY_INTEGRITY...",
      "SYNCHRONIZING_ASSET_METADATA...",
      "PULLING_SECURE_CREDENTIALS...",
      "REPLYING_TO_CHALLENGE_NODE...",
      "VALIDATING_RSA_4096_BITMAP...",
      "SESSION_TOKEN_GENERATED: 0x8F2A...",
      "BYPASSING_LATENCY_BARRIERS...",
      "READY_FOR_PROVISIONING."
    ];
    let index = 0;
    const interval = setInterval(() => {
      setLines(prev => [...prev.slice(-8), techLines[index]]);
      index = (index + 1) % techLines.length;
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0a0a0a] dark:bg-black/40 rounded-2xl p-5 font-mono text-[10px] text-emerald-400/90 border border-emerald-500/20 shadow-2xl overflow-hidden h-48 flex flex-col justify-end">
      {lines.map((line, i) => (
        <div key={`${line}-${i}`} className="animate-in fade-in slide-in-from-left-2 duration-300 mb-1 font-bold tracking-tight">
          <span className="text-blue-500 mr-2 opacity-80">➜</span>
          {line}
          {i === lines.length - 1 && <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 align-middle" />}
        </div>
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Initialize theme based on system preference or default to light
    const isDarkGlobal = document.documentElement.classList.contains("dark");
    setIsDark(isDarkGlobal);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Protocol Success", {
          description: "System access granted. Welcome back.",
          duration: 3000,
        });
        router.push("/");
        router.refresh();
      } else {
        toast.error("Protocol Denial", {
          description: data.message || "Credential mismatch detected.",
        });
      }
    } catch {
      toast.error("Infrastructure Error", {
        description: "Node synchronization failed.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={cn(
      "min-h-svh flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-700",
      isDark ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#3b82f610_0%,transparent_40%)]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#6366f110_0%,transparent_40%)]" />

        {/* Animated Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>


      <div className="w-full max-w-5xl px-6 relative z-10 flex flex-col items-center">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-0 right-6 p-3 rounded-full bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="size-5 text-yellow-400" /> : <Moon className="size-5 text-slate-600" />}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-4xl bg-white/5 dark:bg-black/20 p-4 lg:p-8 rounded-[3rem] border border-slate-200 dark:border-white/10 backdrop-blur-2xl shadow-2xl">

          {/* Left Side: Branding & Terminal */}
          <div className="flex flex-col space-y-8 animate-in slide-in-from-left-8 duration-1000">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 bg-gradient-to-tr from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
                  <ShieldCheck className="size-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">
                    7 FORGE <span className="text-primary not-italic">INC</span>
                  </h2>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 dark:text-white/30 uppercase leading-none">
                    Security Operations Center
                  </p>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Powering <br /> Advanced <br /> <span className="text-primary underline decoration-primary/20">Media Tech.</span>
              </h1>
            </div>

            <Terminal />

            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">
              <span className="flex items-center gap-1.5"><Zap className="size-3 text-primary" /> Low Latency</span>
              <span className="flex items-center gap-1.5"><Globe className="size-3 text-blue-500" /> Global Edge</span>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="bg-white dark:bg-[#111] p-8 lg:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 animate-in slide-in-from-right-8 duration-1000">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-1">Welcome Operator</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Initialize authorized session to proceed.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-1">
                  Secure ID
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-white/20 group-focus-within:text-primary transition-colors">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-bold text-sm"
                    placeholder="admin@7forge.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/40 ml-1">
                  Access Key
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-300 dark:text-white/20 group-focus-within:text-primary transition-colors">
                    <Lock className="size-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-bold text-sm"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <>
                      LOG IN
                      <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">
              <span>Encrypted SHA-256</span>
              <span>v8.4.2-STABLE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Media info decorative bar */}
      <div className="fixed bottom-0 left-0 w-full p-6 flex items-center justify-between bg-white dark:bg-black/40 border-t border-slate-200 dark:border-white/10 backdrop-blur-md z-20 pointer-events-none">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Uptime</span>
            <span className="text-xs font-mono font-bold tracking-tighter">99.998% UPTIME GUARANTEED</span>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Traffic</span>
            <span className="text-xs font-mono font-bold tracking-tighter">1.2 TB / MIN STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">Global Network Core : Active</span>
        </div>
      </div>
    </div>
  );
}
