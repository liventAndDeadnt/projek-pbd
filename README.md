# Inventori GOstore

Aplikasi inventori dan penjualan dengan backend Go, frontend React, dan database MySQL. Repository ini berisi API backend serta antarmuka web untuk pengelolaan katalog dan alur inventori.

## Teknologi

- **Backend:** Go, Gin, sqlx, MySQL
- **Frontend:** React, TypeScript, Vite, React Router
- **Autentikasi:** JWT dalam cookie HTTP-only

## Fitur saat ini

- Login, logout, dan pemeriksaan sesi pengguna.
- API katalog barang dan satuan, termasuk operasi baca dan tulis.
- API baca vendor, termasuk daftar dan detail.
- Antarmuka dashboard dan halaman katalog.
- Halaman pengadaan, penerimaan, retur, stok, penjualan, dan laporan sebagai prototipe frontend; sebagian alur belum terhubung ke API dan belum menyimpan perubahan ke database.

> **Catatan database:** struktur tabel dan data awal tidak disertakan dalam repository ini. Siapkan database MySQL beserta tabel yang diperlukan sebelum menjalankan backend. Berkas di `backend/db/routines/` saat ini berisi catatan rancangan function, trigger, stored procedure, dan view; berkas tersebut belum merupakan skrip database siap pakai.

## Struktur repository

```text
backend/
  cmd/api/                 titik masuk server Go
  internal/
    catalog/               API barang, satuan, dan vendor
    identity/              login dan sesi pengguna
    platform/              konfigurasi, database, middleware, dan helper HTTP
    inventory/             domain inventori (dalam pengembangan)
    procurement/           domain pengadaan (dalam pengembangan)
    reporting/             domain laporan (dalam pengembangan)
    sales/                  domain penjualan (dalam pengembangan)
  db/routines/             catatan rancangan SQL routines
frontend/
  src/features/            halaman dan fitur React
  src/shared/              komponen dan helper bersama
docs/                       dokumentasi arsitektur dan optimasi query
```

Backend mengikuti alur `handler → service → repository`. Akses SQL berada di repository. Frontend memakai helper API bersama untuk mengirim request ke backend.

## Persyaratan

- Go 1.25 atau lebih baru
- Node.js dan npm
- MySQL yang sudah berjalan
- Database dan tabel aplikasi yang sudah disiapkan

## Menjalankan aplikasi di komputer lokal

### 1. Siapkan backend

Buka terminal di root repository:

```powershell
cd backend
Copy-Item .env.example .env
```

Isi `.env` dengan konfigurasi MySQL dan secret JWT milikmu:

| Variabel | Keterangan |
|---|---|
| `APP_PORT` | Port backend; gunakan `8080` agar sesuai dengan proxy frontend bawaan. |
| `DB_USER` | Username MySQL. |
| `DB_PASS` | Password MySQL. |
| `DB_HOST` | Host MySQL, biasanya `127.0.0.1` untuk lokal. |
| `DB_PORT` | Port MySQL, biasanya `3306`. |
| `DB_NAME` | Nama database yang sudah disiapkan. |
| `JWT_SECRET` | Secret acak minimal 32 karakter. |
| `JWT_TTL_HOURS` | Lama sesi JWT dalam jam. |
| `COOKIE_SECURE` | Gunakan `false` untuk HTTP lokal; aktifkan untuk HTTPS. |

> Jangan commit `.env` atau membagikan nilai secret dan password database.

Jalankan server dari folder `backend`:

```powershell
go run ./cmd/api
```

Backend menyediakan pemeriksaan kesehatan di `http://localhost:8080/healthz`.

### 2. Siapkan frontend

Buka terminal kedua dari root repository:

```powershell
cd frontend
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`. Saat mode pengembangan, request `/api` diteruskan ke `http://localhost:8080`; karena itu backend harus berjalan dan nilai `APP_PORT` perlu cocok.

## Pemeriksaan dan build

Dari folder `backend`:

```powershell
go test ./...
```

Dari folder `frontend`:

```powershell
npm run lint
npm run build
```

Build frontend menghasilkan berkas ke `backend/web/dist`. Backend saat ini belum menyajikan berkas frontend hasil build; untuk pengembangan lokal, jalankan Vite dengan `npm run dev`.

## Endpoint API utama

| Method | Path | Akses | Keterangan |
|---|---|---|---|
| `GET` | `/healthz` | Publik | Memeriksa server backend. |
| `POST` | `/api/auth/login` | Publik | Login dan membuat sesi. |
| `POST` | `/api/auth/logout` | Publik | Mengakhiri sesi. |
| `GET` | `/api/auth/me` | Login | Mengambil pengguna dari sesi aktif. |
| `GET` | `/api/barang` | Login | Membaca daftar barang. |
| `GET` | `/api/satuan` | Login | Membaca daftar satuan. |
| `GET` | `/api/vendor` | Login | Membaca daftar vendor. |

Operasi tulis barang dan satuan tersedia di backend. Integrasi operasi tersebut dari antarmuka frontend masih dalam pengembangan.
