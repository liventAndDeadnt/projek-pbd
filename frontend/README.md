# Frontend Inventori GOstore

React 19, TypeScript, Vite, dan React Router. Login memakai auth backend yang sudah ada.

Tampilan memakai design system kecil berbasis CSS variable: sidebar terang, kartu putih, tipografi Inter, dan breakpoint responsif. Gaya lama `dashboard.css`, `login.css`, dan `index.css` sudah dihapus dan diganti oleh folder `src/styles/`.

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173, /api diproxy ke http://localhost:8080
npm run build     # hasil build ditulis ke ../backend/web/dist
npm run lint
```

Untuk login dan data master, jalankan backend serta MySQL. Build hanya menghasilkan aset frontend; backend belum menyajikan aset tersebut.

## Struktur

```text
src/
  styles/                       token, base, shell, components, pages, responsive
  shared/                       api, komponen UI, ikon SVG, format, hook media query
  features/
    identity/                   login, sesi, route protection, pengguna, role
    dashboard/                  shell, navigasi role, dashboard
    catalog/                    barang, satuan, vendor, margin
    sales/                      POS, riwayat penjualan, margin aktif
    procurement/                daftar, detail, dan draft pengadaan
    inventory/                  penerimaan, stock, dan kartu stok
    returns/                    retur ke vendor
    reporting/                  laporan dan konfigurasi jenis laporan
```

## Status integrasi

- Login, logout, pemeriksaan sesi, serta CRUD barang, satuan, vendor, margin, pengguna, dan role memakai API nyata.
- Dashboard mengambil jumlah dan daftar barang terbaru dari API master.
- POS membaca katalog barang aktif dan margin aktif dari API; proses checkout masih pratinjau lokal dan belum menyimpan transaksi.
- Pengadaan, penerimaan, retur, kartu stok, riwayat penjualan, dan laporan masih berupa UI. Data transaksi belum tersedia dari backend.

## Catatan responsif

- Sidebar berubah menjadi drawer di bawah 1024px, dengan overlay, tombol tutup, `Escape`, dan `inert` saat tertutup.
- Grid statistik menjadi dua kolom di bawah 1180px dan satu kolom di bawah 520px.
- Tabel memakai `overflow-x`; kolom sekunder memakai `hide-sm` dan disembunyikan di layar kecil agar kolom utama tetap terbaca.
- Form dan ringkasan POS berubah menjadi satu kolom di layar kecil.
