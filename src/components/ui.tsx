"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { cn, initials, avatarHue } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const BTN_VARIANTS: Record<string, string> = {
  primary:
    "bg-ink text-paper hover:bg-black shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] disabled:bg-mute",
  accent:
    "bg-accent text-white hover:bg-accent-deep shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_8px_18px_-10px_rgba(13,110,99,0.7)] disabled:bg-mute",
  outline: "border border-line bg-white text-ink hover:border-ink/40 hover:bg-paper",
  ghost: "text-ink-soft hover:bg-ink/[0.05] hover:text-ink",
  danger: "bg-danger text-white hover:bg-[#a63627]",
  soft: "bg-accent-soft text-accent hover:bg-accent hover:text-white",
};
const BTN_SIZES: Record<string, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-4 text-[13px] gap-2 py-2",
  lg: "h-11 px-5 text-sm gap-2",
  icon: "h-9 w-9 justify-center",
  "icon-sm": "h-7.5 w-7.5 justify-center",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BTN_VARIANTS;
  size?: keyof typeof BTN_SIZES;
};
export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center rounded-lg font-medium transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        BTN_VARIANTS[variant],
        BTN_SIZES[size],
        className
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Badge / StatusBadge
// ---------------------------------------------------------------------------

const BADGE_TONES: Record<string, string> = {
  gray: "bg-ink/[0.06] text-ink-soft",
  green: "bg-[#e7f4ec] text-[#1a7f44]",
  amber: "bg-amber-soft text-amber",
  red: "bg-danger-soft text-danger",
  blue: "bg-[#e8effc] text-[#2b5cb8]",
  violet: "bg-[#efe9fb] text-[#6d4bbf]",
  teal: "bg-accent-soft text-accent",
  outline: "border border-line text-ink-soft",
};
export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-white",
        hover && "transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(23,24,28,0.35)]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat
// ---------------------------------------------------------------------------

export function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-line hover:border-line-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute">{label}</p>
          <p className="mt-2 font-display text-[34px] font-light leading-none tracking-tight text-ink font-num">
            {value}
          </p>
          {sub && <div className="mt-2.5 text-xs text-ink-soft">{sub}</div>}
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 [&>svg]:h-[18px] [&>svg]:w-[18px]"
            style={{ backgroundColor: `${tone ?? "#0d6e63"}14`, color: tone ?? "#0d6e63" }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] font-light leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13px] text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form primitives
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline gap-2 text-xs font-semibold text-ink-soft">
        {label}
        {required && <span className="text-danger">*</span>}
        {hint && <span className="font-normal text-mute">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const INPUT_CLS =
  "w-full rounded-lg border border-line bg-paper/50 px-3 py-2 text-[13px] text-ink outline-none transition placeholder:text-mute/70 focus:border-accent focus:bg-white disabled:opacity-50";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(INPUT_CLS, className)} {...props} />;
}
export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(INPUT_CLS, "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238b8f98%22 stroke-width=%222%22%3E%3Cpath d=%22m6 9 6 6 6-6%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat pr-8", className)} {...props}>
      {children}
    </select>
  );
}
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(INPUT_CLS, "min-h-[72px] resize-y", className)} {...props} />;
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-ink-soft">
      <span className="relative flex h-[18px] w-[18px] items-center justify-center">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-[5px] border border-line bg-white transition peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
        <svg
          className="relative h-3 w-3 text-white opacity-0 transition peer-checked:opacity-100"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6.2 4.8 9 10 3.2" />
        </svg>
      </span>
      {label}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-card border border-line bg-white shadow-2xl",
              width
            )}
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-light tracking-tight text-ink">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs text-mute">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-mute transition hover:bg-ink/5 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Tabs (segmented)
// ---------------------------------------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            active === t.key ? "text-paper" : "text-ink-soft hover:text-ink"
          )}
        >
          {active === t.key && (
            <motion.span
              layoutId="tab-pill"
              className="absolute inset-0 rounded-md bg-ink"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <span className="relative z-10">
            {t.label}
            {t.count !== undefined && (
              <span className={cn("ml-1.5 font-num", active === t.key ? "text-paper/60" : "text-mute")}>
                {t.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const hue = avatarHue(name ?? "?");
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: `hsl(${hue} 35% 93%)`,
        color: `hsl(${hue} 45% 38%)`,
      }}
    >
      {initials(name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dot-grid flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-white/60 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05] text-mute [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      )}
      <p className="font-display text-lg font-light text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-mute">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal (scroll/mount animation wrapper)
// ---------------------------------------------------------------------------

export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2.5"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-200",
          checked ? "bg-accent" : "bg-ink/15 group-hover:bg-ink/25"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </span>
      {label && <span className="text-[13px] text-ink-soft">{label}</span>}
    </button>
  );
}
