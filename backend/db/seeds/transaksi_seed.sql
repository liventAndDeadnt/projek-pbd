-- =============================================================================
-- DATABASE SEEDER: TABEL-TABEL TRANSAKSI
-- Proyek: Inventori GOstore (Praktikum Basis Data)
-- File: backend/db/seeds/transaksi_seed.sql
--
-- Tabel yang dicakup:
-- 1. pengadaan
-- 2. detail_pengadaan
-- 3. penerimaan
-- 4. detail_penerimaan
-- 5. retur
-- 6. detail_retur
-- 7. penjualan
-- 8. detail_penjualan
-- 9. kartu_stok (mendukung trigger otomatis maupun manual fallback)
--
-- Skenario yang disimulasikan:
-- - Skenario 1: Pengadaan Selesai ('C') & Penerimaan Penuh ('C')
-- - Skenario 2: Retur Barang Rusak ke Vendor dari Penerimaan
-- - Skenario 3: Transaksi Penjualan Kasir (POS) multi-item & kalkulasi PPN/margin
-- - Skenario 4: Pengadaan Penerimaan Parsial / Bertahap ('S')
-- - Skenario 5: Pengadaan Disetujui ('A') menunggu penerimaan gudang
-- - Skenario 6: Pengadaan Baru ('P' Pending) menunggu approval
-- - Skenario 7: Pengadaan Dibatalkan ('X' Cancelled)
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 0. RESOLUSI ID MASTER DATA (Dinamis dengan fallback nilai default)
-- -----------------------------------------------------------------------------
SET @iduser_admin      = COALESCE((SELECT iduser FROM user WHERE LOWER(username) = 'admin' LIMIT 1), 1);
SET @iduser_purchasing = COALESCE((SELECT iduser FROM user WHERE LOWER(username) = 'purchasing' LIMIT 1), @iduser_admin);
SET @iduser_gudang     = COALESCE((SELECT iduser FROM user WHERE LOWER(username) = 'gudang' LIMIT 1), @iduser_admin);
SET @iduser_kasir      = COALESCE((SELECT iduser FROM user WHERE LOWER(username) = 'kasir' LIMIT 1), @iduser_admin);

SET @idvendor_1        = COALESCE((SELECT idvendor FROM vendor WHERE status = '1' ORDER BY idvendor ASC LIMIT 1), 1);
SET @idvendor_2        = COALESCE((SELECT idvendor FROM vendor WHERE status = '1' ORDER BY idvendor ASC LIMIT 1 OFFSET 1), @idvendor_1);

SET @idmargin_aktif    = COALESCE((SELECT idmargin_penjualan FROM margin_penjualan WHERE status = 1 ORDER BY idmargin_penjualan DESC LIMIT 1), 1);

SET @idbarang_1        = COALESCE((SELECT idbarang FROM barang WHERE status = 1 ORDER BY idbarang ASC LIMIT 1), 1);
SET @idbarang_2        = COALESCE((SELECT idbarang FROM barang WHERE status = 1 ORDER BY idbarang ASC LIMIT 1 OFFSET 1), 2);
SET @idbarang_3        = COALESCE((SELECT idbarang FROM barang WHERE status = 1 ORDER BY idbarang ASC LIMIT 1 OFFSET 2), 3);
SET @idbarang_4        = COALESCE((SELECT idbarang FROM barang WHERE status = 1 ORDER BY idbarang ASC LIMIT 1 OFFSET 3), 4);

-- -----------------------------------------------------------------------------
-- 1. PENGADAAN (HEADER)
-- -----------------------------------------------------------------------------
-- 1001: Pengadaan Selesai (Completed - 'C')
-- 1002: Pengadaan Bertahap (Partial - 'S')
-- 1003: Pengadaan Disetujui (Approved - 'A')
-- 1004: Pengadaan Baru (Pending - 'P')
-- 1005: Pengadaan Dibatalkan (Cancelled - 'X')
INSERT INTO pengadaan (
  idpengadaan, timestamp, user_iduser, status, vendor_idvendor,
  subtotal_nilai, ppn, total_nilai
) VALUES
(1001, DATE_SUB(NOW(), INTERVAL 14 DAY), @iduser_purchasing, 'C', @idvendor_1, 3900000, 11, 4329000),
(1002, DATE_SUB(NOW(), INTERVAL 6 DAY),  @iduser_purchasing, 'S', @idvendor_2, 2640000, 11, 2930400),
(1003, DATE_SUB(NOW(), INTERVAL 2 DAY),  @iduser_purchasing, 'A', @idvendor_1, 1950000, 11, 2164500),
(1004, DATE_SUB(NOW(), INTERVAL 1 DAY),  @iduser_purchasing, 'P', @idvendor_2, 1600000, 11, 1776000),
(1005, DATE_SUB(NOW(), INTERVAL 4 DAY),  @iduser_purchasing, 'X', @idvendor_1, 600000,  11, 666000)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  subtotal_nilai = VALUES(subtotal_nilai),
  ppn = VALUES(ppn),
  total_nilai = VALUES(total_nilai);

-- -----------------------------------------------------------------------------
-- 2. DETAIL PENGADAAN
-- -----------------------------------------------------------------------------
INSERT INTO detail_pengadaan (
  iddetail_pengadaan, harga_satuan, jumlah, sub_total, idbarang, idpengadaan
) VALUES
-- Item Pengadaan #1001 (Total subtotal: 3.900.000)
(2001, 12000, 100, 1200000, @idbarang_1, 1001),
(2002, 30000, 50,  1500000, @idbarang_2, 1001),
(2003, 15000, 80,  1200000, @idbarang_3, 1001),

-- Item Pengadaan #1002 (Total subtotal: 2.640.000)
(2004, 12000, 120, 1440000, @idbarang_1, 1002),
(2005, 20000, 60,  1200000, @idbarang_4, 1002),

-- Item Pengadaan #1003 (Total subtotal: 1.950.000)
(2006, 30000, 40,  1200000, @idbarang_2, 1003),
(2007, 15000, 50,  750000,  @idbarang_3, 1003),

-- Item Pengadaan #1004 (Total subtotal: 1.600.000)
(2008, 20000, 80,  1600000, @idbarang_4, 1004),

-- Item Pengadaan #1005 (Total subtotal: 600.000)
(2009, 12000, 50,  600000,  @idbarang_1, 1005)
ON DUPLICATE KEY UPDATE
  harga_satuan = VALUES(harga_satuan),
  jumlah = VALUES(jumlah),
  sub_total = VALUES(sub_total);

-- -----------------------------------------------------------------------------
-- 3. PENERIMAAN (HEADER)
-- -----------------------------------------------------------------------------
-- 3001: Penerimaan lengkap dari Pengadaan #1001 ('C')
-- 3002: Penerimaan parsial batch 1 dari Pengadaan #1002 ('S')
INSERT INTO penerimaan (
  idpenerimaan, created_at, status, idpengadaan, iduser
) VALUES
(3001, DATE_SUB(NOW(), INTERVAL 13 DAY), 'C', 1001, @iduser_gudang),
(3002, DATE_SUB(NOW(), INTERVAL 5 DAY),  'S', 1002, @iduser_gudang)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  created_at = VALUES(created_at);

-- -----------------------------------------------------------------------------
-- 4. DETAIL PENERIMAAN
-- -----------------------------------------------------------------------------
INSERT INTO detail_penerimaan (
  iddetail_penerimaan, idpenerimaan, barang_idbarang,
  jumlah_terima, harga_satuan_terima, sub_total_terima
) VALUES
-- Batch Penerimaan #3001 (Semua pesanan pengadaan #1001 diterima penuh)
(4001, 3001, @idbarang_1, 100, 12000, 1200000),
(4002, 3001, @idbarang_2, 50,  30000, 1500000),
(4003, 3001, @idbarang_3, 80,  15000, 1200000),

-- Batch Penerimaan #3002 (Baru 50% kuantitas pengadaan #1002 yang datang)
(4004, 3002, @idbarang_1, 60,  12000, 720000),
(4005, 3002, @idbarang_4, 30,  20000, 600000)
ON DUPLICATE KEY UPDATE
  jumlah_terima = VALUES(jumlah_terima),
  harga_satuan_terima = VALUES(harga_satuan_terima),
  sub_total_terima = VALUES(sub_total_terima);

-- -----------------------------------------------------------------------------
-- 5. RETUR (HEADER)
-- -----------------------------------------------------------------------------
-- 5001: Retur barang cacat dari Penerimaan #3001
INSERT INTO retur (
  idretur, created_at, idpenerimaan, iduser
) VALUES
(5001, DATE_SUB(NOW(), INTERVAL 12 DAY), 3001, @iduser_gudang)
ON DUPLICATE KEY UPDATE
  created_at = VALUES(created_at);

-- -----------------------------------------------------------------------------
-- 6. DETAIL RETUR
-- -----------------------------------------------------------------------------
INSERT INTO detail_retur (
  iddetail_retur, jumlah, alasan, idretur, iddetail_penerimaan
) VALUES
(6001, 5, 'Kemasan luar sobek dan isi basah saat dibongkar di gudang', 5001, 4003)
ON DUPLICATE KEY UPDATE
  jumlah = VALUES(jumlah),
  alasan = VALUES(alasan);

-- -----------------------------------------------------------------------------
-- 7. PENJUALAN (HEADER)
-- -----------------------------------------------------------------------------
-- Asumsi margin aktif ~10%, PPN 11%
-- 7001: Penjualan Kasir 1
-- 7002: Penjualan Kasir 2
-- 7003: Penjualan Kasir 3
INSERT INTO penjualan (
  idpenjualan, created_at, subtotal_nilai, ppn, total_nilai, iduser, idmargin_penjualan
) VALUES
(7001, DATE_SUB(NOW(), INTERVAL 10 DAY), 264000, 11, 293040, @iduser_kasir, @idmargin_aktif),
(7002, DATE_SUB(NOW(), INTERVAL 8 DAY),  445500, 11, 494505, @iduser_kasir, @idmargin_aktif),
(7003, DATE_SUB(NOW(), INTERVAL 3 DAY),  484000, 11, 537240, @iduser_kasir, @idmargin_aktif)
ON DUPLICATE KEY UPDATE
  subtotal_nilai = VALUES(subtotal_nilai),
  ppn = VALUES(ppn),
  total_nilai = VALUES(total_nilai);

-- -----------------------------------------------------------------------------
-- 8. DETAIL PENJUALAN
-- -----------------------------------------------------------------------------
-- Harga jual = harga dasar + margin (mis. 12k->13.2k, 30k->33k, 15k->16.5k, 20k->22k)
INSERT INTO detail_penjualan (
  iddetail_penjualan, harga_satuan, jumlah, subtotal, penjualan_idpenjualan, idbarang
) VALUES
-- Item Penjualan #7001
(8001, 13200, 10, 132000, 7001, @idbarang_1),
(8002, 33000, 4,  132000, 7001, @idbarang_2),

-- Item Penjualan #7002
(8003, 33000, 6,  198000, 7002, @idbarang_2),
(8004, 16500, 15, 247500, 7002, @idbarang_3),

-- Item Penjualan #7003
(8005, 13200, 20, 264000, 7003, @idbarang_1),
(8006, 22000, 10, 220000, 7003, @idbarang_4)
ON DUPLICATE KEY UPDATE
  harga_satuan = VALUES(harga_satuan),
  jumlah = VALUES(jumlah),
  subtotal = VALUES(subtotal);

-- -----------------------------------------------------------------------------
-- 9. KARTU STOK (LEDGER PERSISTEN)
-- -----------------------------------------------------------------------------
-- PENTING:
-- Jika trigger di 02_triggers.sql sudah aktif, tabel kartu_stok akan
-- otomatis terisi saat INSERT ke detail_penerimaan, detail_retur, dan detail_penjualan.
-- Klausa 'WHERE NOT EXISTS (SELECT 1 FROM kartu_stok LIMIT 1)' memastikan data
-- di bawah ini HANYA dimasukkan jika trigger belum terpasang (mencegah duplikasi saldo).
INSERT INTO kartu_stok (
  idkartu_stok, jenis_transaksi, masuk, keluar, stock, created_at, idtransaksi, idbarang
)
SELECT * FROM (
  -- Mutasi 1: Penerimaan #3001 (Barang 1 masuk +100, saldo 100)
  SELECT 9001 AS idkartu_stok, 'M' AS jenis_transaksi, 100 AS masuk, 0 AS keluar, 100 AS stock,
         DATE_SUB(NOW(), INTERVAL 13 DAY) AS created_at, 3001 AS idtransaksi, @idbarang_1 AS idbarang
  UNION ALL
  -- Mutasi 2: Penerimaan #3001 (Barang 2 masuk +50, saldo 50)
  SELECT 9002, 'M', 50, 0, 50, DATE_SUB(NOW(), INTERVAL 13 DAY), 3001, @idbarang_2
  UNION ALL
  -- Mutasi 3: Penerimaan #3001 (Barang 3 masuk +80, saldo 80)
  SELECT 9003, 'M', 80, 0, 80, DATE_SUB(NOW(), INTERVAL 13 DAY), 3001, @idbarang_3
  UNION ALL
  -- Mutasi 4: Retur #5001 (Barang 3 keluar -5, saldo 75)
  SELECT 9004, 'R', 0, 5, 75, DATE_SUB(NOW(), INTERVAL 12 DAY), 5001, @idbarang_3
  UNION ALL
  -- Mutasi 5: Penjualan #7001 (Barang 1 keluar -10, saldo 90)
  SELECT 9005, 'J', 0, 10, 90, DATE_SUB(NOW(), INTERVAL 10 DAY), 7001, @idbarang_1
  UNION ALL
  -- Mutasi 6: Penjualan #7001 (Barang 2 keluar -4, saldo 46)
  SELECT 9006, 'J', 0, 4, 46, DATE_SUB(NOW(), INTERVAL 10 DAY), 7001, @idbarang_2
  UNION ALL
  -- Mutasi 7: Penjualan #7002 (Barang 2 keluar -6, saldo 40)
  SELECT 9007, 'J', 0, 6, 40, DATE_SUB(NOW(), INTERVAL 8 DAY), 7002, @idbarang_2
  UNION ALL
  -- Mutasi 8: Penjualan #7002 (Barang 3 keluar -15, saldo 60)
  SELECT 9008, 'J', 0, 15, 60, DATE_SUB(NOW(), INTERVAL 8 DAY), 7002, @idbarang_3
  UNION ALL
  -- Mutasi 9: Penerimaan #3002 Batch 1 (Barang 1 masuk +60, saldo 150)
  SELECT 9009, 'M', 60, 0, 150, DATE_SUB(NOW(), INTERVAL 5 DAY), 3002, @idbarang_1
  UNION ALL
  -- Mutasi 10: Penerimaan #3002 Batch 1 (Barang 4 masuk +30, saldo 30)
  SELECT 9010, 'M', 30, 0, 30, DATE_SUB(NOW(), INTERVAL 5 DAY), 3002, @idbarang_4
  UNION ALL
  -- Mutasi 11: Penjualan #7003 (Barang 1 keluar -20, saldo 130)
  SELECT 9011, 'J', 0, 20, 130, DATE_SUB(NOW(), INTERVAL 3 DAY), 7003, @idbarang_1
  UNION ALL
  -- Mutasi 12: Penjualan #7003 (Barang 4 keluar -10, saldo 20)
  SELECT 9012, 'J', 0, 10, 20, DATE_SUB(NOW(), INTERVAL 3 DAY), 7003, @idbarang_4
) AS seed_ledger
WHERE NOT EXISTS (SELECT 1 FROM kartu_stok LIMIT 1)
ON DUPLICATE KEY UPDATE
  stock = VALUES(stock);

-- Kebijakan harga sederhana: harga terima terakhir menimpa barang.harga.
-- Retur tidak mengembalikan harga lama.
CALL sp_update_harga_dari_penerimaan(3001);
CALL sp_update_harga_dari_penerimaan(3002);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEEDER TRANSAKSI SELESAI
-- Ringkasan Saldo Akhir Stok:
-- - Barang 1: 130 unit  (Masuk: 160, Keluar: 30)
-- - Barang 2:  40 unit  (Masuk:  50, Keluar: 10)
-- - Barang 3:  60 unit  (Masuk:  80, Keluar Retur: 5, Keluar Jual: 15)
-- - Barang 4:  20 unit  (Masuk:  30, Keluar: 10)
-- =============================================================================
