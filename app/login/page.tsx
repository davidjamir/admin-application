"use client";

import React from "react";
import { 
  ShieldCheck, 
  Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLogin } from "@/hooks/useLogin";
import { LoginBranding } from "./components/LoginBranding";
import { LoginForm } from "./components/LoginForm";
import { LoginFooter } from "./components/LoginFooter";

export default function LoginPage() {
  const {
    email, setEmail, password, setPassword,
    isLoading, mounted, isDark, toggleTheme, handleLogin
  } = useLogin();

  return (
    <div className={cn(
      "min-h-svh flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-700",
      isDark ? "bg-[#050505] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {!mounted ? (
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <div className="size-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <ShieldCheck className="size-7 text-primary/40" />
            </div>
            <div className="h-4 w-32 bg-primary/10 rounded" />
        </div>
      ) : (
        <>
          {/* Dynamic Background Elements */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#3b82f610_0%,transparent_40%)]" />
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#6366f110_0%,transparent_40%)]" />
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
              <LoginBranding />
              <LoginForm 
                email={email} 
                setEmail={setEmail} 
                password={password} 
                setPassword={setPassword} 
                handleLogin={handleLogin} 
                isLoading={isLoading} 
              />
            </div>
          </div>
          <LoginFooter />
        </>
      )}
    </div>
  );
}
