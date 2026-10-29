import type { PengadaanStatus } from './procurement.types'

type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue'

export const PENGADAAN_STATUS: Record<
  PengadaanStatus,
  { label: string; tone: BadgeTone }
> = {
  P: { label: 'Pending', tone: 'amber' },
  A: { label: 'Approved', tone: 'blue' },
  R: { label: 'Rejected', tone: 'red' },
  X: { label: 'Cancelled', tone: 'neutral' },
  S: { label: 'Partial', tone: 'blue' },
  C: { label: 'Completed', tone: 'green' },
}

export const PENGADAAN_TABS: { label: string; value: PengadaanStatus | '' }[] = [
  { label: 'Semua status', value: '' },
  ...Object.entries(PENGADAAN_STATUS).map(([value, meta]) => ({
    label: meta.label,
    value: value as PengadaanStatus,
  })),
]

export function statusMeta(status: string): { label: string; tone: BadgeTone } {
  return PENGADAAN_STATUS[status as PengadaanStatus] ?? { label: status, tone: 'neutral' }
}
