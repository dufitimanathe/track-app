"use client";

import { resolveUploadUrl } from "@/lib/config";

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

export function DocumentPreview({
  fileUrl,
  title,
}: {
  fileUrl: string;
  title?: string;
}) {
  const href = resolveUploadUrl(fileUrl);
  if (!href) {
    return <p className="text-sm text-text-muted">No file</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      {isImageUrl(href) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href}
          alt={title || "Document preview"}
          className="max-h-64 w-full rounded-lg border border-border object-contain bg-surface-muted"
        />
      ) : isPdfUrl(href) ? (
        <iframe
          title={title || "PDF preview"}
          src={href}
          className="h-72 w-full rounded-lg border border-border bg-surface-muted"
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface-muted px-3 py-4 text-sm text-text-secondary">
          Preview not available for this file type.
        </div>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-sm font-medium text-primary hover:underline"
      >
        Open / download full file
      </a>
    </div>
  );
}
