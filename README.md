# Projek PBD — Inventory & Penjualan (Go + MySQL)

Modular monolith: backend Go (Gin + sqlx + MySQL) dan frontend React dalam satu repo.
Penilaian utama proyek: efektivitas query MySQL (CRUD, trigger, stored procedure, function, view).

## Struktur

```
backend/
  cmd/api/            entrypoint (main.go)
  internal/
    platform/         config, database, httpx, apperr, middleware (dipakai semua modul)
    identity/         login, user, role
    catalog/          barang, satuan            <- contoh modul lengkap: satuan
    procurement/      vendor, pengadaan, penerimaan, retur
    sales/            penjualan (POS), margin_penjualan
    inventory/        kartu_stok (diisi trigger)
    reporting/        dashboard & laporan (read-only)
  db/                 migrations, seeds, routines (function/trigger/procedure/view)
  web/dist/           hasil build frontend (di-embed ke binary saat production)
frontend/             React + Vite (lihat frontend/README.md)
docs/                 arsitektur, ADR, query-optimization, logbook
```

Alur tiap modul: `handler (HTTP) -> service (aturan bisnis) -> repository (SQL)`.
Semua SQL hanya ada di `*_repository.go`.

## Menjalankan backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env  (lalu isi DB_PASS & DB_NAME)
go mod tidy                 # unduh dependency + bikin go.sum
go run ./cmd/api
```

Tes: `GET http://localhost:8080/healthz` dan `GET http://localhost:8080/api/satuan`.

## Endpoint satuan (contoh pola CRUD)

| Method | Path | Fungsi |
|---|---|---|
| GET | /api/satuan | list |
| GET | /api/satuan/:id | detail |
| POST | /api/satuan | tambah `{"nama_satuan":"Pcs"}` |
| PUT | /api/satuan/:id | ubah |
| DELETE | /api/satuan/:id | hapus (409 kalau masih dipakai barang) |
