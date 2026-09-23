import { appConfig } from '@/lib/config';

/** Isolated from client.ts to avoid circular imports during 401 refresh. */
export async function refreshTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const response = await fetch(`${appConfig.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await response.json()) as {
    success?: boolean;
    data?: { accessToken: string; refreshToken: string };
    error?: { message?: string };
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message ?? 'Refresh failed');
  }

  return payload.data;
}
