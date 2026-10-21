# Inventori GOstore

Aplikasi inventori internal untuk mengelola data barang, satuan, vendor, margin penjualan, pengguna, dan role. Proyek ini menggunakan Go untuk backend, React dan TypeScript untuk frontend, serta MySQL sebagai basis data.

Beberapa fitur pengelolaan data inti sudah terhubung ke backend dan basis data. Alur transaksi dan laporan masih dalam tahap pengembangan.

## Teknologi

- **Backend:** Go 1.25+, Gin, sqlx, MySQL
- **Frontend:** React 19, TypeScript, Vite, React Router
- **Autentikasi:** JWT yang disimpan dalam cookie `HTTP-only`
- **Basis data:** MySQL

## Fitur yang sudah tersedia

- Login, logout, dan pemeriksaan sesi.
- CRUD barang, satuan, vendor, margin penjualan, pengguna, dan role.
- Pencarian dan penyaringan status pada halaman yang mendukungnya.
- Pembacaan data katalog memerlukan sesi login; perubahan data katalog hanya dapat dilakukan admin.
- Pengelolaan pengguna dan role hanya dapat dilakukan admin.
- Saat margin dibuat, identitas pengguna diambil dari sesi login.

## Fitur dalam pengembangan

Halaman pengadaan, penerimaan, retur, inventori, penjualan, riwayat penjualan, dan laporan masih berupa tampilan/alur frontend dan belum seluruhnya terhubung ke backend serta penyimpanan basis data.

Angka pada dashboard masih berupa nilai sementara hingga API transaksi dan laporan tersedia. Role yang tersimpan di basis data belum secara otomatis menentukan izin akses dan navigasi; aturan akses role masih ditetapkan di kode aplikasi.

## Alur aplikasi

1. Pengguna membuka halaman di browser.
2. Halaman React memanggil klien API dari fitur terkait.
3. Permintaan dikirim ke backend melalui awalan `/api` dengan cookie sesi `HTTP-only`.
4. Gin menerima permintaan dan menjalankan middleware autentikasi/otorisasi yang sesuai.
5. Handler menangani HTTP dan validasi masukan.
6. Service menjalankan aturan aplikasi.
7. Repository menjalankan kueri SQL ke MySQL.
8. Hasil dikembalikan ke frontend untuk ditampilkan.

Backend disusun sebagai modular monolith. Tanggung jawab HTTP berada di handler, aturan aplikasi di service, dan akses SQL di repository. Pembacaan beberapa data menggunakan view MySQL, sementara operasi perubahan data menulis ke tabel sumber.


## Struktur direktori

```text
backend/
├── cmd/api/                 Titik masuk aplikasi Go
├── internal/catalog/        API barang, satuan, vendor, dan margin
├── internal/identity/       Autentikasi, pengguna, dan role
├── internal/platform/       Konfigurasi, koneksi basis data, autentikasi,
│                            middleware, dan helper HTTP
├── internal/inventory/      Kerangka fitur inventori
├── internal/procurement/    Kerangka fitur pengadaan
├── internal/reporting/      Kerangka fitur laporan
├── internal/sales/          Kerangka fitur penjualan
├── db/routines/             Catatan rencana routine dan view SQL
└── web/dist/                Hasil build frontend

frontend/
└── src/
    ├── features/            Halaman dan fitur React
    └── shared/              Klien API, komponen, dan utilitas bersama

docs/                        Dokumentasi proyek
```

## Persiapan basis data

Skema basis data utama, data awal, dan konfigurasi MySQL tidak disertakan sebagai migrasi siap pakai di repository ini. Siapkan basis data dan tabel yang diperlukan terlebih dahulu.

Backend membutuhkan tabel inti `barang`, `satuan`, `vendor`, `margin_penjualan`, `user`, dan `role` beserta relasinya. View yang diharapkan untuk pembacaan data adalah:

- `v_barang_detail`
- `v_satuan_detail`
- `v_vendor_detail`
- `v_margin_detail`
- `v_user_detail`
- `v_role_detail`

Berkas di `backend/db/routines` berisi catatan/rencana SQL, bukan migrasi skema yang siap dijalankan. Pastikan struktur tabel, view, indeks, dan data awal sesuai dengan kebutuhan aplikasi sebelum menjalankannya.

## Menjalankan secara lokal

### Kebutuhan

- Go 1.25 atau lebih baru
- Node.js dan npm
- MySQL yang sudah berisi skema serta view yang diperlukan

### Menyiapkan backend

Dari direktori utama proyek, jalankan:

```powershell
cd backend
Copy-Item .env.example .env
```

Sesuaikan isi `backend/.env` dengan konfigurasi MySQL dan aplikasi:

| Variabel | Keterangan | Contoh lokal |
|---|---|---|
| `APP_PORT` | Port backend | `8080` |
| `DB_USER` | Pengguna MySQL | `root` |
| `DB_PASS` | Kata sandi MySQL | Sesuaikan dengan konfigurasi lokal |
| `DB_HOST` | Host MySQL | `127.0.0.1` |
| `DB_PORT` | Port MySQL | `3306` |
| `DB_NAME` | Nama basis data | Nama basis data proyek |
| `JWT_SECRET` | Kunci penandatanganan JWT, minimal 32 karakter | Buat nilai rahasia sendiri |
| `JWT_TTL_HOURS` | Masa berlaku sesi dalam jam | `8` |
| `COOKIE_SECURE` | Gunakan cookie secure melalui HTTPS | `false` untuk HTTP lokal; `true` pada HTTPS |

Jalankan backend:

```powershell
go run ./cmd/api
```

Pemeriksaan kesehatan backend tersedia di `http://localhost:8080/healthz` (sesuaikan port jika `APP_PORT` berbeda).

### Menyiapkan frontend

Buka terminal kedua dari direktori utama proyek:

```powershell
cd frontend
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`. Pastikan backend berjalan pada port yang dituju oleh proxy `/api` di konfigurasi Vite. Jika `APP_PORT` diubah, sesuaikan juga konfigurasi proxy frontend.

## Ringkasan endpoint API

Semua endpoint berikut menggunakan awalan `/api`.

| Endpoint | Akses | Keterangan |
|---|---|---|
| `POST /auth/login` | Publik | Login |
| `POST /auth/logout` | Publik | Logout dan menghapus cookie sesi |
| `GET /auth/me` | Perlu login | Memeriksa sesi pengguna |
| `/barang` | GET perlu login; perubahan hanya admin | CRUD barang |
| `/satuan` | GET perlu login; perubahan hanya admin | CRUD satuan |
| `/vendor` | GET perlu login; perubahan hanya admin | CRUD vendor |
| `/margin` | GET perlu login; perubahan hanya admin | CRUD margin penjualan |
| `/users` | Admin | CRUD pengguna |
| `/roles` | Admin | CRUD role |

Endpoint koleksi mendukung `GET` dan `POST`. Endpoint berdasarkan ID mendukung `GET /:id`, `PUT /:id`, dan `DELETE /:id` sesuai aturan akses di atas. Penghapusan data dapat ditolak jika data tersebut masih digunakan oleh transaksi atau data lain.

Parameter daftar yang tersedia:

- `search` untuk barang, satuan, vendor, role, dan pengguna.
- `status` untuk barang, satuan, vendor, dan margin.
- `role` untuk penyaringan pengguna berdasarkan role.

## Pemeriksaan dan build

Dari direktori `backend`:

```powershell
go build ./...
go test ./...
```

Dari direktori `frontend`:

```powershell
npm run lint
npm run build
```

Build frontend menghasilkan berkas di `backend/web/dist`. Backend saat ini melayani API dan pemeriksaan kesehatan; gunakan server pengembangan Vite untuk menjalankan frontend secara lokal.

## Catatan

- Jangan masukkan kredensial basis data atau `JWT_SECRET` ke Git.
- Pastikan cookie `COOKIE_SECURE` diaktifkan pada lingkungan HTTPS.
- Fitur transaksi dan laporan perlu dihubungkan ke API serta penyimpanan basis data sebelum digunakan sebagai alur operasional penuh.
