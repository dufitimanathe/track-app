import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[12px]",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  accent?: "none" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const accents = {
  none: "",
  primary: "border-l-[3px] border-l-primary",
  success: "border-l-[3px] border-l-success",
  warning: "border-l-[3px] border-l-warning",
  danger: "border-l-[3px] border-l-danger",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  accent = "none",
  className,
}: MetricCardProps) {
  return (
    <Card className={cn(accents[accent], className)} padding="md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-semibold text-text tracking-tight truncate">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-text-secondary truncate">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="shrink-0 rounded-[8px] bg-primary-soft p-2 text-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
