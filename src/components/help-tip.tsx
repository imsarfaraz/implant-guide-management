"use client";

import * as React from "react";
import { Info, HelpCircle, ChevronDown, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  title?: string;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  size?: "sm" | "md";
  className?: string;
  learnMoreHref?: string;
}

export function HelpTip({
  title,
  content,
  side = "top",
  size = "sm",
  className,
  learnMoreHref = "/help",
}: HelpTipProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center align-middle", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Help information"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-mute transition-all hover:bg-accent/10 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          size === "sm" ? "h-4 w-4" : "h-5 w-5"
        )}
      >
        <HelpCircle
          className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="tooltip"
          className={cn(
            "pointer-events-auto absolute z-50 w-72 rounded-xl border border-line bg-white p-3.5 shadow-xl transition-all animate-fade-in text-left text-xs font-normal text-ink",
            sideClasses[side]
          )}
        >
          {title && (
            <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-accent">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>{title}</span>
            </div>
          )}
          <div className="leading-relaxed text-ink-soft">{content}</div>
          {learnMoreHref && (
            <div className="mt-2.5 border-t border-line-soft pt-2 text-[11px]">
              <Link
                href={learnMoreHref}
                className="font-medium text-accent hover:underline inline-flex items-center gap-1"
                onClick={() => setOpen(false)}
              >
                Learn more in Guide & Help →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PageHelpGuideProps {
  title: string;
  badge?: string;
  description: string;
  tips: { title: string; desc: string }[];
  defaultOpen?: boolean;
}

export function PageHelpGuide({
  title,
  badge = "How to use this page",
  description,
  tips,
  defaultOpen = false,
}: PageHelpGuideProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-line bg-gradient-to-r from-white via-paper/60 to-white shadow-sm transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-paper/80"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {badge}
            </span>
            <h4 className="text-sm font-semibold text-ink">{title}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-ink-soft">
          <span>{isOpen ? "Hide tips" : "Show tips & quick guide"}</span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-line-soft bg-white/70 px-5 py-4 animate-fade-in">
          <p className="text-xs text-ink-soft leading-relaxed mb-4">{description}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tips.map((t, idx) => (
              <div key={idx} className="rounded-lg border border-line-soft bg-paper/40 p-3">
                <p className="text-xs font-semibold text-ink mb-1 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                    {idx + 1}
                  </span>
                  {t.title}
                </p>
                <p className="text-[11px] text-mute leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex justify-end">
            <Link
              href="/help"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Open Full Surgical Guide & Implant Manual →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
