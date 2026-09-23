import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-RW")} RWF`;
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-US", { maximumFractionDigits: 1 })} km`;
}

export function formatRelativeTime(isoOrLabel: string): string {
  // Mock data often uses human labels already
  if (!isoOrLabel.includes("T")) return isoOrLabel;
  const date = new Date(isoOrLabel);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function greetingForHour(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Billing rule: first km 500 RWF, each additional km 400 RWF */
export function calculateFare(distanceKm: number): {
  firstKm: number;
  remainingKm: number;
  remainingCost: number;
  total: number;
} {
  if (distanceKm <= 0) {
    return { firstKm: 0, remainingKm: 0, remainingCost: 0, total: 0 };
  }
  const firstKm = Math.min(distanceKm, 1);
  const remainingKm = Math.max(distanceKm - 1, 0);
  const remainingCost = Math.round(remainingKm * 400);
  const total = (firstKm > 0 ? 500 : 0) + remainingCost;
  return { firstKm, remainingKm, remainingCost, total };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}
