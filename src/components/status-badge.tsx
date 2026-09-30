import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: { name: string; color: string };
  size?: "sm" | "md";
  className?: string;
}) {
  const { name, color } = status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        className
      )}
      style={{
        backgroundColor: `${color}14`,
        color,
        boxShadow: `inset 0 0 0 1px ${color}2e`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
}
