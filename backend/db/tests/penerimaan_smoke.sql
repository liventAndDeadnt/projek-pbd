-- Smoke test penerimaan parsial dan penuh.
-- Jalankan di database scratch; semua perubahan di-ROLLBACK.

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

UPDATE barang SET harga = 10000 WHERE idbarang = @barang;

SET @items := JSON_ARRAY(
  JSON_OBJECT('idbarang', @barang, 'jumlah', 10, 'harga_satuan', 11000)
);

CALL sp_pengadaan_buat(@admin, @vendor, 0, @items, @po);
CALL sp_pengadaan_status(@po, 'A', @admin, FALSE, @out);

CALL sp_penerimaan_buat(
  @po, @gudang,
  JSON_ARRAY(JSON_OBJECT('idbarang', @barang, 'jumlah_terima', 4)),
  @terima1
);

SELECT '1. terima 4: status penerimaan S' AS skenario,
  IF((SELECT status FROM penerimaan WHERE idpenerimaan = @terima1) = 'S', 'OK', 'FAIL') AS hasil;

SELECT '2. terima 4: status PO S' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po) = 'S', 'OK', 'FAIL') AS hasil;

SELECT '3. terima 4: stok bertambah 4' AS skenario,
  IF(fn_stok_terkini(@barang) = 4, 'OK', 'FAIL') AS hasil;

SELECT '4. terima 4: harga barang 11000' AS skenario,
  IF((SELECT harga FROM barang WHERE idbarang = @barang) = 11000, 'OK', 'FAIL') AS hasil;

CALL sp_penerimaan_buat(
  @po, @gudang,
  JSON_ARRAY(JSON_OBJECT('idbarang', @barang, 'jumlah_terima', 6)),
  @terima2
);

SELECT '5. terima 6: status penerimaan C' AS skenario,
  IF((SELECT status FROM penerimaan WHERE idpenerimaan = @terima2) = 'C', 'OK', 'FAIL') AS hasil;

SELECT '6. terima 6: status PO C' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po) = 'C', 'OK', 'FAIL') AS hasil;

SELECT '7. terima 6: stok total 10' AS skenario,
  IF(fn_stok_terkini(@barang) = 10, 'OK', 'FAIL') AS hasil;

SELECT '8. view penerimaan menghitung total' AS skenario,
  IF((SELECT total_qty FROM v_penerimaan_detail WHERE idpenerimaan = @terima2) = 6, 'OK', 'FAIL') AS hasil;

ROLLBACK;
