import { apiFetch, getAccessToken } from '@/lib/api/client';
import { appConfig, withNgrokSkipBrowserWarning } from '@/lib/config';

export type UploadedCompanyDocument = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  relativePath: string;
};

export async function uploadCompanyDocumentFile(
  file: File,
): Promise<UploadedCompanyDocument> {
  const form = new FormData();
  form.append('file', file);

  const headers = withNgrokSkipBrowserWarning(new Headers());
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${appConfig.apiUrl}/uploads/company-documents`, {
    method: 'POST',
    headers,
    body: form,
  });

  const payload = (await response.json().catch(() => null)) as {
    success?: boolean;
    data?: UploadedCompanyDocument;
    error?: { message?: string };
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error?.message ?? `Upload failed (${response.status})`);
  }

  return payload.data;
}

/** Convenience for authenticated JSON helpers that still need the envelope. */
export async function uploadCompanyDocumentViaApi(file: File) {
  // Kept for typed callers that already use apiFetch patterns elsewhere.
  void apiFetch;
  return uploadCompanyDocumentFile(file);
}
