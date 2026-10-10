# Frontend Inventori GOstore

React 19, TypeScript, Vite, dan React Router. Login memakai sistem auth backend yang sudah ada. Modul procurement, receiving, retur, POS, inventory, dan reporting saat ini berupa UI simulasi; data simulasi tidak dikirim ke backend atau disimpan.

## Menjalankan

```bash
npm install
npm run dev       # http://localhost:5173, /api diproxy ke http://localhost:8080
npm run build     # hasil build ditulis ke ../backend/web/dist
npm run lint
```

Untuk login dan katalog barang/satuan, jalankan backend serta MySQL. Build hanya menghasilkan aset frontend ke `backend/web/dist`; backend saat ini belum memiliki route untuk menyajikan aset tersebut.

## Struktur

```text
src/
  App.tsx, main.tsx             router dan provider
  shared/                       API helper dan komponen UI bersama
  features/
    identity/                   login, sesi, route protection
    dashboard/                  AppShell, role navigation, dashboard
    catalog/                    barang dan satuan; memakai API yang sudah ada
    mock/                       form daftar kosong dan metadata master data mock
    procurement/                daftar, detail, dan draft pengadaan
    inventory/                  penerimaan dan kartu stok
    returns/                    alur retur ke vendor
    sales/                      POS dan konfigurasi margin simulasi
    reporting/                  layar laporan kosong dan filter
```

Data bisnis mock dimulai kosong. Input form boleh digunakan untuk mencoba validasi dan preview, tetapi setiap submit hanya memberi umpan balik simulasi. Katalog mempertahankan request baca yang sudah ada; form tambah/ubah/hapus katalog tidak memanggil API tulis.
