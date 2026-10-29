-- Smoke test modul pengadaan.
-- Jalankan di database scratch, bukan database kerja:
--   mysql -uroot projek_basdat_pengadaan < backend/db/tests/pengadaan_smoke.sql
-- Semua data uji di-ROLLBACK di akhir.

START TRANSACTION;

SELECT iduser INTO @purchasing
FROM user u
JOIN role r ON r.idrole = u.idrole
WHERE LOWER(r.nama_role) = 'purchasing'
ORDER BY u.iduser
LIMIT 1;

SELECT iduser INTO @admin
FROM user u
JOIN role r ON r.idrole = u.idrole
WHERE LOWER(r.nama_role) = 'admin'
ORDER BY u.iduser
LIMIT 1;

SET @purchasing := COALESCE(@purchasing, (SELECT iduser FROM user ORDER BY iduser LIMIT 1));
SET @admin := COALESCE(@admin, @purchasing);

SELECT idvendor INTO @vendor FROM vendor WHERE status = '1' ORDER BY idvendor LIMIT 1;
SELECT idbarang INTO @barang1 FROM barang WHERE status = 1 ORDER BY idbarang LIMIT 1;
SELECT idbarang INTO @barang2
FROM barang
WHERE status = 1 AND idbarang <> @barang1
ORDER BY idbarang
LIMIT 1;

SET @stock1_before := fn_stok_terkini(@barang1);
SET @stock2_before := fn_stok_terkini(@barang2);

SET @items := JSON_ARRAY(
  JSON_OBJECT('idbarang', @barang1, 'jumlah', 2, 'harga_satuan', 10000),
  JSON_OBJECT('idbarang', @barang2, 'jumlah', 1, 'harga_satuan', 5000)
);

CALL sp_pengadaan_buat(@purchasing, @vendor, 11, @items, @new_id);
SET @po := @new_id;

SELECT '1. total header (25000 + 2750 = 27750)' AS skenario,
  IF(
    (SELECT subtotal_nilai FROM pengadaan WHERE idpengadaan = @po) = 25000
    AND (SELECT ppn FROM pengadaan WHERE idpengadaan = @po) = 11
    AND (SELECT total_nilai FROM pengadaan WHERE idpengadaan = @po) = 27750,
    'OK', 'FAIL'
  ) AS hasil;

SELECT '2. dua baris detail' AS skenario,
  IF((SELECT COUNT(*) FROM detail_pengadaan WHERE idpengadaan = @po) = 2, 'OK', 'FAIL') AS hasil;

SELECT '3. status awal P' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po) = 'P', 'OK', 'FAIL') AS hasil;

SELECT '4. pengadaan tidak mengubah stok' AS skenario,
  IF(
    fn_stok_terkini(@barang1) = @stock1_before
    AND fn_stok_terkini(@barang2) = @stock2_before,
    'OK', 'FAIL'
  ) AS hasil;

CALL sp_pengadaan_status(@po, 'A', @admin, FALSE, @out);
SELECT '5. approve P -> A' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po) = 'A', 'OK', 'FAIL') AS hasil;

CALL sp_pengadaan_status(@po, 'X', @admin, FALSE, @out);
SELECT '6. admin cancel A -> X' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po) = 'X', 'OK', 'FAIL') AS hasil;

CALL sp_pengadaan_buat(@purchasing, @vendor, 0, @items, @new_id);
SET @po2 := @new_id;
CALL sp_pengadaan_status(@po2, 'X', @purchasing, TRUE, @out);
SELECT '7. purchasing cancel draft milik sendiri' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po2) = 'X', 'OK', 'FAIL') AS hasil;

CALL sp_pengadaan_buat(@purchasing, @vendor, 0, @items, @new_id);
SET @po3 := @new_id;
CALL sp_pengadaan_status(@po3, 'R', @admin, FALSE, @out);
SELECT '8. admin reject P -> R' AS skenario,
  IF((SELECT status FROM pengadaan WHERE idpengadaan = @po3) = 'R', 'OK', 'FAIL') AS hasil;

ROLLBACK;

-- Kasus negatif dijalankan terpisah dengan mysql --force, contoh:
--   CALL sp_pengadaan_buat(..., JSON_ARRAY(JSON_OBJECT('idbarang', 1, ...),
--     JSON_OBJECT('idbarang', 1, ...)), @id);   -- barang duplikat -> error 1644
--   CALL sp_pengadaan_status(<id>, 'A', <purchasing>, FALSE, @out); -- non-admin ditolak di Go
--   CALL sp_pengadaan_status(<id>, 'X', <purchasing>, TRUE, @out);  -- bukan pemilik -> error 1644
--   CALL sp_pengadaan_status(<id>, 'X', <admin>, FALSE, @out);     -- status R tidak boleh cancel
