export const GPS_QUALITY = {
  excellentAccuracy: 25,
  acceptableAccuracy: 80,
  poorAccuracy: 200,
  rejectAccuracy: 500,
  staleAfterMs: 30_000,
} as const;

export type GpsQuality =
  | 'excellent'
  | 'acceptable'
  | 'poor'
  | 'very-poor'
  | 'stale'
  | 'unknown';

/** Green / blue / orange / red / stale for admin live map. */
export const GPS_QUALITY_COLORS: Record<
  GpsQuality,
  { background: string; border: string; label: string }
> = {
  excellent: { background: '#16a34a', border: '#14532d', label: '≤25 m' },
  acceptable: { background: '#2563eb', border: '#1e3a8a', label: '26–80 m' },
  poor: { background: '#ea580c', border: '#9a3412', label: '81–200 m' },
  'very-poor': { background: '#dc2626', border: '#7f1d1d', label: '201–500 m' },
  stale: { background: '#94a3b8', border: '#475569', label: 'Stale >30 s' },
  unknown: { background: '#64748b', border: '#334155', label: 'Unknown' },
};

export function classifyGpsQuality(
  accuracy: number | null | undefined,
  capturedAt?: string | Date | null,
  nowMs = Date.now(),
): GpsQuality {
  if (capturedAt) {
    const at = typeof capturedAt === 'string' ? Date.parse(capturedAt) : capturedAt.getTime();
    if (Number.isFinite(at) && nowMs - at > GPS_QUALITY.staleAfterMs) {
      return 'stale';
    }
  }
  if (accuracy == null || !Number.isFinite(accuracy) || accuracy < 0) {
    return 'unknown';
  }
  if (accuracy <= GPS_QUALITY.excellentAccuracy) return 'excellent';
  if (accuracy <= GPS_QUALITY.acceptableAccuracy) return 'acceptable';
  if (accuracy <= GPS_QUALITY.poorAccuracy) return 'poor';
  if (accuracy <= GPS_QUALITY.rejectAccuracy) return 'very-poor';
  return 'very-poor';
}
