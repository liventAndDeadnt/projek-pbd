import type { PenerimaanStatus } from './penerimaan.types'

type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue'

export const PENERIMAAN_STATUS: Record<
  PenerimaanStatus,
  { label: string; tone: BadgeTone }
> = {
  S: { label: 'Partial', tone: 'blue' },
  C: { label: 'Completed', tone: 'green' },
}

export function penerimaanStatusMeta(status: string): { label: string; tone: BadgeTone } {
  return PENERIMAAN_STATUS[status as PenerimaanStatus] ?? { label: status, tone: 'neutral' }
}
