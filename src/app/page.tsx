import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { LandingPage } from "@/components/landing/landing-page";

const displayFont = Space_Grotesk({ subsets: ["latin"], variable: "--font-landing-display", display: "swap" });

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
