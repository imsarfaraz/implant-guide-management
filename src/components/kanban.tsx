"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { toast } from "sonner";
import { AlertTriangle, Search, User } from "lucide-react";


export interface KanbanCard {
  id: number;
  displayId: string;
  doctor: string;
  patient: string;
  system: string | null;
  plannerInitials: string | null;
  age: string;
  stuck: boolean;
}

export interface KanbanCol {
  key: string;
  name: string;
  color: string;
  kind: string;
  cards: KanbanCard[];
}

export function KanbanBoard({
  columns,
  currentUserInitials,
  onMove,
}: {
  columns: KanbanCol[];
  currentUserInitials?: string;
  onMove: (payload: { caseId: number; statusKey: string }) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [cols, setCols] = React.useState(columns);
  const [search, setSearch] = React.useState("");
  const [myCases, setMyCases] = React.useState(false);
  const [dragId, setDragId] = React.useState<number | null>(null);
  const [overKey, setOverKey] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<number | null>(null);

  React.useEffect(() => setCols(columns), [columns]);

  const reset = () => {
    setDragId(null);
    setOverKey(null);
    setBusy(null);
  };

  function handleDrop(colKey: string) {
    if (dragId == null) return;
    const fromCol = cols.find((c) => c.cards.some((x) => x.id === dragId));
    if (!fromCol || fromCol.key === colKey) {
      reset();
      return;
    }
    const card = fromCol.cards.find((x) => x.id === dragId)!;
    const prev = cols;
    const next = cols.map((c) =>
      c.key === colKey
        ? { ...c, cards: [{ ...card, age: "now", stuck: false }, ...c.cards] }
        : c.key === fromCol.key
          ? { ...c, cards: c.cards.filter((x) => x.id !== dragId) }
          : c
    );
    setCols(next);
    setBusy(dragId);

    onMove({ caseId: dragId, statusKey: colKey })
      .then((res) => {
        if (!res.ok) {
          setCols(prev);
          toast.error(res.error ?? "Could not move the case");
        }
      })
      .catch(() => {
        setCols(prev);
        toast.error("Could not move the case — check your connection");
      })
      .finally(reset);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" />
          <input
            type="text"
            placeholder="Search cases, doctors, patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper/50 py-1.5 pl-9 pr-3 text-[13px] text-ink outline-none transition focus:border-accent focus:bg-white"
          />
        </div>
        {currentUserInitials && (
          <button
            onClick={() => setMyCases((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition",
              myCases ? "border-accent bg-accent/10 text-accent" : "border-line bg-paper/50 text-ink-soft hover:bg-white hover:text-ink"
            )}
          >
            <User className="h-3.5 w-3.5" />
            My Cases
          </button>
        )}
      </div>

      <div className="flex flex-1 items-start gap-4 overflow-x-auto pb-4">
        {cols.map((col) => {
          const visibleCards = col.cards.filter((card) => {
            if (myCases && card.plannerInitials !== currentUserInitials) return false;
            if (search) {
              const q = search.toLowerCase();
              return (
                card.doctor.toLowerCase().includes(q) ||
                card.patient.toLowerCase().includes(q) ||
                card.displayId.toLowerCase().includes(q)
              );
            }
            return true;
          });

          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overKey !== col.key) setOverKey(col.key);
              }}
              onDragLeave={() => setOverKey((k) => (k === col.key ? null : k))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.key);
              }}
              className={cn(
                "flex h-fit max-h-[calc(100vh-220px)] min-h-[220px] flex-col rounded-xl border transition-colors duration-200",
                overKey === col.key ? "border-accent/50 bg-accent-soft/50" : "border-line bg-paper-deep/70"
              )}
            >
              <header className="flex items-center justify-between px-4 pb-2.5 pt-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-soft">{col.name}</h3>
                </div>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-paper text-[10px] font-bold text-ink-soft font-num">
                  {visibleCards.length}
                </span>
              </header>
              <div className="flex max-h-[calc(100vh-280px)] min-h-[120px] flex-col gap-2.5 overflow-y-auto p-2">
                {visibleCards.map((card) => (
                  <div
                    key={card.id}
                    draggable={busy !== card.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", String(card.id));
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(card.id);
                    }}
                    onDragEnd={reset}
                    className={cn(
                      "animate-fade-up cursor-grab rounded-lg border border-line bg-white p-3.5 transition-all duration-200 active:cursor-grabbing",
                      dragId === card.id && "opacity-40",
                      busy === card.id && "animate-pulse"
                    )}
                  >
                    <Link href={`/cases/${card.id}`} className="block" draggable={false}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold tracking-wide text-accent font-num">{card.displayId}</span>
                        {card.stuck && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-danger">
                            <AlertTriangle className="h-3 w-3" />
                            stuck
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 truncate text-[13px] font-semibold text-ink">{card.doctor}</p>
                      <p className="truncate text-xs text-ink-soft">{card.patient}</p>
                      <div className="mt-2.5 flex items-center justify-between border-t border-line-soft pt-2.5">
                        <span className="truncate text-[11px] text-mute">{card.system ?? "—"}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wide text-mute">{card.age}</span>
                          {card.plannerInitials && (
                            <Avatar name={card.plannerInitials === "?" ? null : card.plannerInitials} size={22} />
                          )}
                        </span>
                      </div>
                    </Link>
                  </div>
                ))}
                {visibleCards.length === 0 && (
                  <div
                    className={cn(
                      "flex h-24 items-center justify-center rounded-lg border border-dashed text-[11px] transition-colors",
                      overKey === col.key ? "border-accent/50 text-accent" : "border-line text-mute"
                    )}
                  >
                    Drop cases here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
