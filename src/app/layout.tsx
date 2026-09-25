import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { StoreProvider } from "@/store/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: { url: "/logo.jpeg", type: "image/jpeg", sizes: "any" },
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  title: {
    default: "FleetOps",
    template: "%s · FleetOps",
  },
  description:
    "Corporate transport and motorcycle fleet management — dispatch, GPS tracking, trips, and billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <StoreProvider>
          <AuthBootstrap>{children}</AuthBootstrap>
        </StoreProvider>
      </body>
    </html>
  );
}
