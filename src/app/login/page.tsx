"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Cross, KeyRound, ShieldCheck } from "lucide-react";
import { login } from "@/lib/auth-actions";
import { Button, Input } from "@/components/ui";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await login(fd);
    if (res?.error) {
      setError(res.error);
      setPending(false);
    } else {
      router.push("/");
    }
  }

  return (
    <div className="flex min-h-screen w-full font-sans antialiased">
      
      {/* LEFT COLUMN - Dark Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-[#101216] px-16 py-12 text-white relative overflow-hidden shadow-[inset_-20px_0_40px_rgba(0,0,0,0.2)]">
        
        {/* Subtle background ambient light */}
        <div className="absolute top-1/2 -left-20 w-[600px] h-[600px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Logo block */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent shadow-[0_8px_20px_-8px_rgba(13,110,99,0.8)]">
            <Cross className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[16px] font-medium leading-tight tracking-tight">
              Mumbai Surgical Guide Lab
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
              Case Console
            </p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-[420px]">
          <h1 className="font-display text-4xl leading-tight font-light tracking-tight mb-6 text-white/90">
            Implant & surgical<br />
            guide case<br />
            management.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400 mb-8 font-light">
            One continuous dataset for guide planning and implant hardware supply — replacing monthly spreadsheet forks with timestamped, attributed case history.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span className="text-sm text-zinc-300 font-light">Kanban pipeline with full status history</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span className="text-sm text-zinc-300 font-light">Structured implant & accessory line items</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/20">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span className="text-sm text-zinc-300 font-light">Turnaround, failure and workload reporting</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-semibold">
          Secure Staff Access · 2026
        </div>
      </div>

      {/* RIGHT COLUMN - Light Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-paper grain p-8">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[380px]"
        >
          <div className="mb-10">
            <h2 className="font-display text-4xl font-light text-ink tracking-tight mb-2">Sign in</h2>
            <p className="text-sm text-ink-soft">Enter your staff credentials to access the lab console.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg bg-red-50 border border-red-100 p-3 text-center text-sm font-medium text-red-600"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">
                Username <span className="text-danger">*</span>
              </label>
              <Input 
                name="username" 
                placeholder="e.g. admin" 
                required 
                className="h-11 shadow-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink">
                Password <span className="text-danger">*</span>
              </label>
              <Input 
                type="password" 
                name="password" 
                placeholder="••••••••" 
                required 
                className="h-11 shadow-sm"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-[14px] font-semibold mt-4 shadow-sm bg-zinc-300 hover:bg-zinc-400 text-zinc-700 hover:text-zinc-900 border-none transition-colors"
              disabled={pending}
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <span className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 mr-2" /> Sign in
                </span>
              )}
            </Button>
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-mute">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sessions are valid for 30 days on this device.
          </div>
        </motion.div>
      </div>

    </div>
  );
}
