"use client";

import styles from "./whatsapp-fab.module.css";

const DEFAULT_SUPPORT_WHATSAPP = "250782027429";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function WhatsAppFab() {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim() ||
    process.env.NEXT_PUBLIC_BOOKING_WHATSAPP?.trim() ||
    DEFAULT_SUPPORT_WHATSAPP;
  const phone = digitsOnly(raw);
  if (!phone) return null;

  const href = `https://wa.me/${phone}?text=${encodeURIComponent(
    "Hello Kampere Motari, I would like to request a trip.",
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.fab}
      aria-label="Message Kampere Motari on WhatsApp"
      title="Chat on WhatsApp"
    >
      <span className={styles.ping} aria-hidden="true" />
      <span className={styles.icon} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor">
          <path d="M19.11 17.4c-.28-.14-1.65-.81-1.9-.91-.26-.09-.44-.14-.63.14-.19.28-.72.91-.88 1.1-.16.19-.33.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.82-.73-1.38-1.64-1.54-1.91-.16-.28-.02-.43.12-.57.12-.12.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1.01 2.71 1.15 2.9c.14.19 1.98 3.02 4.8 4.23 1.79.77 2.49.84 3.38.71.54-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.11-.26-.18-.54-.32z" />
          <path d="M16.04 3C9.4 3 4 8.37 4 14.97c0 2.1.55 4.15 1.6 5.96L4 29l8.27-1.56c1.74.95 3.7 1.45 5.73 1.45h.01c6.64 0 12.04-5.37 12.04-11.97C30.05 8.37 24.68 3 16.04 3zm0 21.9h-.01c-1.8 0-3.56-.48-5.1-1.39l-.37-.22-4.91.93.99-4.78-.24-.39a9.9 9.9 0 01-1.52-5.28c0-5.48 4.49-9.94 10.02-9.94 5.53 0 10.02 4.46 10.02 9.94 0 5.48-4.49 9.94-9.88 9.94z" />
        </svg>
      </span>
    </a>
  );
}
