-- Smoke test kebijakan harga saat penerimaan.
-- Jalankan di database scratch, bukan database kerja:
--   mysql -u root projek_basdat_scratch < backend/db/tests/penerimaan_harga_smoke.sql
-- Semua perubahan di-ROLLBACK di akhir.

START TRANSACTION;

SELECT iduser INTO @admin
FROM user u JOIN role r ON r.idrole = u.idrole
WHERE LOWER(r.nama_role) = 'admin'
ORDER BY u.iduser LIMIT 1;

SELECT iduser INTO @gudang
FROM user u JOIN role r ON r.idrole = u.idrole
WHERE LOWER(r.nama_role) = 'gudang'
ORDER BY u.iduser LIMIT 1;

SET @admin := COALESCE(@admin, (SELECT iduser FROM user ORDER BY iduser LIMIT 1));
SET @gudang := COALESCE(@gudang, @admin);

SELECT idvendor INTO @vendor FROM vendor WHERE status = '1' ORDER BY idvendor LIMIT 1;
SELECT idbarang INTO @barang FROM barang WHERE status = 1 ORDER BY idbarang LIMIT 1;

-- Kondisi awal yang mudah dibaca.
UPDATE barang SET harga = 10000 WHERE idbarang = @barang;

SET @items := JSON_ARRAY(
  JSON_OBJECT('idbarang', @barang, 'jumlah', 10, 'harga_satuan', 11000)
);

CALL sp_pengadaan_buat(@admin, @vendor, 0, @items, @po);

SELECT '1. PO belum mengubah harga' AS skenario,
  IF((SELECT harga FROM barang WHERE idbarang = @barang) = 10000, 'OK', 'FAIL') AS hasil;

CALL sp_pengadaan_status(@po, 'A', @admin, FALSE, @out);

SET @terima := JSON_ARRAY(
  JSON_OBJECT('idbarang', @barang, 'jumlah_terima', 10)
);

CALL sp_penerimaan_buat(@po, @gudang, @terima, @penerimaan);

SELECT '2. penerimaan menimpa harga ke 11000' AS skenario,
  IF((SELECT harga FROM barang WHERE idbarang = @barang) = 11000, 'OK', 'FAIL') AS hasil;

SELECT iddetail_penerimaan INTO @detail
FROM detail_penerimaan
WHERE idpenerimaan = @penerimaan
LIMIT 1;

SET @retur := JSON_ARRAY(
  JSON_OBJECT('iddetail_penerimaan', @detail, 'jumlah', 10, 'alasan', 'uji rollback')
);

CALL sp_retur_buat(@penerimaan, @gudang, @retur, @idretur);

SELECT '3. retur tidak mengembalikan harga (kebijakan sederhana)' AS skenario,
  IF((SELECT harga FROM barang WHERE idbarang = @barang) = 11000, 'OK', 'FAIL') AS hasil;

ROLLBACK;
