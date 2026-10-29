-- Integritas modul penerimaan.
-- Idempotent: aman dijalankan ulang.

-- 1. Referensi transaksi pada kartu_stok harus cukup untuk ID penerimaan
--    dan retur yang bertipe BIGINT.
SET @col_type := (
  SELECT DATA_TYPE
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'kartu_stok'
    AND column_name = 'idtransaksi'
);

SET @sql := IF(
  @col_type IS NOT NULL AND @col_type <> 'bigint',
  'ALTER TABLE kartu_stok MODIFY idtransaksi BIGINT NOT NULL',
  'SELECT ''kartu_stok.idtransaksi sudah BIGINT'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Satu barang hanya boleh muncul sekali dalam satu dokumen penerimaan.
SET @has_uq := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'detail_penerimaan'
    AND index_name = 'uq_detail_penerimaan_barang'
);

SET @sql := IF(
  @has_uq = 0,
  'ALTER TABLE detail_penerimaan ADD UNIQUE KEY uq_detail_penerimaan_barang (idpenerimaan, barang_idbarang)',
  'SELECT ''uq_detail_penerimaan_barang sudah ada'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Status penerimaan selalu terisi.
SET @status_nullable := (
  SELECT IS_NULLABLE
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'penerimaan'
    AND column_name = 'status'
);

SET @sql := IF(
  @status_nullable = 'YES',
  'ALTER TABLE penerimaan MODIFY status CHAR(1) NOT NULL DEFAULT ''S''',
  'SELECT ''penerimaan.status sudah NOT NULL'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Index untuk daftar/riwayat penerimaan.
SET @has_idx := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'penerimaan'
    AND index_name = 'idx_penerimaan_created'
);

SET @sql := IF(
  @has_idx = 0,
  'ALTER TABLE penerimaan ADD INDEX idx_penerimaan_created (created_at)',
  'SELECT ''idx_penerimaan_created sudah ada'' AS info'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
