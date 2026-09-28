"use client";

import { Avatar } from "@/components/ui/overlay";
import { uploadAvatarFile } from "@/lib/api/uploads";
import { resolveUploadUrl } from "@/lib/config";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAvatarUrl } from "@/store/slices/auth-slice";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";

/** Editable profile photo used in settings / profile pages. */
export function ProfilePhotoEditor({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const { avatarInitials, avatarUrl, userName, userEmail } = useAppSelector((s) => s.auth);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const updated = await uploadAvatarFile(file);
      dispatch(setAvatarUrl(updated.avatarUrl ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar
          initials={avatarInitials || "U"}
          src={resolveUploadUrl(avatarUrl) || null}
          size={size}
        />
        <button
          type="button"
          className="absolute -bottom-1 -right-1 rounded-full border border-border bg-surface p-1.5 text-primary shadow-sm hover:bg-surface-muted disabled:opacity-60"
          aria-label="Change profile photo"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="size-3.5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            void onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text truncate">{userName || "Your profile"}</p>
        <p className="text-xs text-text-secondary truncate">{userEmail || "—"}</p>
        <button
          type="button"
          className="mt-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-60"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Uploading…" : "Change profile photo"}
        </button>
        {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
