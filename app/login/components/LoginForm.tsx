import React from "react"
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react"

interface LoginFormProps {
  email: string
  setEmail: (val: string) => void
  password: string
  setPassword: (val: string) => void
  handleLogin: (e: React.FormEvent) => Promise<void>
  isLoading: boolean
}

export const LoginForm: React.FC<LoginFormProps> = ({
  email, setEmail, password, setPassword, handleLogin, isLoading
}) => {
  return (
    <div className="bg-white dark:bg-[#111] p-8 lg:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/5 animate-in slide-in-from-right-8 duration-1000 text-black">
      <div className="mb-8 text-left">
        <h3 className="text-2xl font-bold mb-1">Welcome Operator</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Initialize authorized session to proceed.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2 text-left">
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
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-bold text-sm text-black"
              placeholder="admin@7forge.com"
            />
          </div>
        </div>

        <div className="space-y-2 text-left">
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
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-white/10 font-bold text-sm text-black"
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
                Sign In
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
  )
}
