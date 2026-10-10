# Frontend

React + TypeScript + Vite. Dev server memakai proxy ke backend Go, jadi cookie sesi berjalan di satu origin.

```bash
npm install
npm run dev        # http://localhost:5173  (/api diteruskan ke http://localhost:8080)
npm run build      # hasil build ke ../backend/web/dist (untuk di-embed ke binary Go)
npm run lint
```

Jalankan backend dulu (`cd backend && go run ./cmd/api`), baru frontend.

## Struktur

```
src/
  main.tsx, App.tsx     router + provider
  shared/               api client (fetch + format error seragam)
  features/
    identity/           login, AuthProvider, RequireAuth
    dashboard/          halaman setelah login (placeholder)
```

Satu folder per modul backend (`identity`, `catalog`, `procurement`, `sales`, ...).
