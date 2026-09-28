import type { Metadata } from "next";
import localFont from "next/font/local";
import { LandingPage } from "@/components/landing/landing-page";

const displayFont = localFont({
  src: "./fonts/space-grotesk-latin-wght-normal.woff2",
  variable: "--font-landing-display",
  display: "swap",
  weight: "300 700",
});

export const metadata: Metadata = {
  title: { absolute: "KAMPERE MOTARI LTD | Better journeys for your team" },
  description: "Company motorcycle transport, made simple. Discover Kampere Motari, learn how to request an employee trip, and connect your team’s journeys, approvals, and fleet operations.",
};

export default function HomePage() {
  return <div className={displayFont.variable}><LandingPage
    email={process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || undefined}
    whatsapp={process.env.NEXT_PUBLIC_BOOKING_WHATSAPP?.replace(/\D/g, "") || undefined}
  /></div>;
}
