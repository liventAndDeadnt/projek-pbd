export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Bentuk response backend: { success, data } atau { success: false, message }
type Envelope<T> = { success: boolean; data?: T; message?: string }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
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
