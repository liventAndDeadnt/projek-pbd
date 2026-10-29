-- View baca untuk modul pengadaan.
-- Jalankan setelah tabel transaksi tersedia.

CREATE OR REPLACE VIEW v_pengadaan_detail AS
SELECT
  p.idpengadaan,
  p.timestamp,
  p.user_iduser,
  u.username,
  p.status,
  p.vendor_idvendor,
  v.nama_vendor,
  COALESCE(p.subtotal_nilai, 0) AS subtotal_nilai,
  COALESCE(p.ppn, 0) AS ppn,
  COALESCE(p.total_nilai, 0) AS total_nilai,
  COALESCE(i.jumlah_item, 0) AS jumlah_item,
  COALESCE(r.jumlah_penerimaan, 0) AS jumlah_penerimaan
FROM pengadaan p
JOIN user u ON u.iduser = p.user_iduser
JOIN vendor v ON v.idvendor = p.vendor_idvendor
LEFT JOIN (
  SELECT idpengadaan, COUNT(*) AS jumlah_item
  FROM detail_pengadaan
  GROUP BY idpengadaan
) i ON i.idpengadaan = p.idpengadaan
LEFT JOIN (
  SELECT idpengadaan, COUNT(*) AS jumlah_penerimaan
  FROM penerimaan
  GROUP BY idpengadaan
) r ON r.idpengadaan = p.idpengadaan;

CREATE OR REPLACE VIEW v_detail_pengadaan_detail AS
SELECT
  dp.iddetail_pengadaan,
  dp.idpengadaan,
  dp.idbarang,
  b.nama AS nama_barang,
  b.jenis,
  s.nama_satuan,
  COALESCE(dp.harga_satuan, 0) AS harga_satuan,
  COALESCE(dp.jumlah, 0) AS jumlah,
  COALESCE(dp.sub_total, 0) AS sub_total,
  COALESCE(t.jumlah_terima, 0) AS jumlah_diterima
FROM detail_pengadaan dp
JOIN barang b ON b.idbarang = dp.idbarang
JOIN satuan s ON s.idsatuan = b.idsatuan
LEFT JOIN (
  SELECT
    pr.idpengadaan,
    dpr.barang_idbarang,
    SUM(dpr.jumlah_terima) AS jumlah_terima
  FROM detail_penerimaan dpr
  JOIN penerimaan pr ON pr.idpenerimaan = dpr.idpenerimaan
  GROUP BY pr.idpengadaan, dpr.barang_idbarang
) t ON t.idpengadaan = dp.idpengadaan AND t.barang_idbarang = dp.idbarang;

CREATE OR REPLACE VIEW v_penerimaan_detail AS
SELECT
  p.idpenerimaan,
  p.created_at,
  p.status,
  p.idpengadaan,
  po.vendor_idvendor,
  v.nama_vendor,
  p.iduser,
  u.username,
  COALESCE(i.jumlah_item, 0) AS jumlah_item,
  COALESCE(i.total_qty, 0) AS total_qty,
  COALESCE(i.total_nilai, 0) AS total_nilai
FROM penerimaan p
JOIN pengadaan po ON po.idpengadaan = p.idpengadaan
JOIN vendor v ON v.idvendor = po.vendor_idvendor
JOIN user u ON u.iduser = p.iduser
LEFT JOIN (
  SELECT
    idpenerimaan,
    COUNT(*) AS jumlah_item,
    SUM(jumlah_terima) AS total_qty,
    SUM(sub_total_terima) AS total_nilai
  FROM detail_penerimaan
  GROUP BY idpenerimaan
) i ON i.idpenerimaan = p.idpenerimaan;

CREATE OR REPLACE VIEW v_detail_penerimaan_detail AS
SELECT
  dp.iddetail_penerimaan,
  dp.idpenerimaan,
  dp.barang_idbarang,
  b.nama AS nama_barang,
  b.jenis,
  s.nama_satuan,
  COALESCE(dp.jumlah_terima, 0) AS jumlah_terima,
  COALESCE(dp.harga_satuan_terima, 0) AS harga_satuan_terima,
  COALESCE(dp.sub_total_terima, 0) AS sub_total_terima
FROM detail_penerimaan dp
JOIN barang b ON b.idbarang = dp.barang_idbarang
JOIN satuan s ON s.idsatuan = b.idsatuan;
