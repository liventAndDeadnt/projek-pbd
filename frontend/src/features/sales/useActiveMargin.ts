import { useEffect, useState } from 'react'
import { listMarginPenjualan } from '../catalog/catalog.api'
import { DEFAULT_MARGIN_PERCENT } from './sales.config'

/**
 * Membaca margin penjualan yang sedang aktif dari API.
 * Jika request gagal atau belum ada data, UI tetap memakai nilai cadangan.
 */
export function useActiveMargin() {
  const [percent, setPercent] = useState(DEFAULT_MARGIN_PERCENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    listMarginPenjualan('Aktif')
      .then((rows) => {
        const active = rows.find((row) => row.status === 1) ?? rows[0]
        if (mounted && active?.persen != null) setPercent(active.persen)
      })
      .catch(() => {
        // UI memakai DEFAULT_MARGIN_PERCENT; tidak perlu mengganggu pengguna.
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return { percent, loading }
}
