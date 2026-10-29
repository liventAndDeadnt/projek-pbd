-- Satu barang hanya boleh muncul satu kali dalam satu pengadaan.
-- Idempoten: aman dijalankan ulang tanpa error duplicate key name.

SET @has_uq := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'detail_pengadaan'
    AND index_name = 'uq_detail_pengadaan_barang'
);

SET @sql := IF(
  @has_uq = 0,
  'ALTER TABLE detail_pengadaan ADD UNIQUE KEY uq_detail_pengadaan_barang (idpengadaan, idbarang)',
  'SELECT ''uq_detail_pengadaan_barang sudah ada'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
