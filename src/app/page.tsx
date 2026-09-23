"use client";

import { homeForRole } from "@/lib/navigation";
import { useAppSelector } from "@/store";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { isAuthenticated, role, hydrated } = useAppSelector((s) => s.auth);
  if (!hydrated) return null;
  if (!isAuthenticated) redirect("/login");
  redirect(homeForRole(role));
}
