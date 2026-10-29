export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Pesan siap tampil untuk error API maupun kegagalan koneksi.
export function errorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'
}

// Bentuk response sistem: { success, data } atau { success: false, message }
type Envelope<T> = { success: boolean; data?: T; message?: string }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'same-origin', // kirim cookie sesi
  })

  let body: Envelope<T> | null = null
  try {
    body = (await res.json()) as Envelope<T>
  } catch {
    // body kosong atau bukan JSON
  }

  if (!res.ok || !body?.success) {
    throw new ApiError(res.status, body?.message ?? 'Terjadi kesalahan. Coba lagi.')
  }
  return body.data as T
}
