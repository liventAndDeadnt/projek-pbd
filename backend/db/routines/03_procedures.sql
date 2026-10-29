-- Stored procedure alur transaksi.
-- Jalankan setelah 01_functions.sql dan 02_triggers.sql.
-- File ini untuk mysql CLI (memakai DELIMITER), bukan migration runner Go.
--
-- Prosedur tidak COMMIT/ROLLBACK sendiri. Backend membungkus CALL di satu
-- transaction agar seluruh insert header + detail + trigger stok atomik.

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_pengadaan_buat$$
CREATE PROCEDURE sp_pengadaan_buat(
  IN p_iduser INT,
  IN p_idvendor INT,
  IN p_ppn INT,
  IN p_items JSON,
  OUT p_idpengadaan BIGINT
)
BEGIN
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_distinct INT DEFAULT 0;
  DECLARE v_subtotal INT DEFAULT 0;

  IF p_items IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item pengadaan wajib diisi.';
  END IF;

  IF p_ppn IS NULL OR p_ppn < 0 OR p_ppn > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PPN harus 0 sampai 100 persen.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user WHERE iduser = p_iduser) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengguna tidak ditemukan.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM vendor
    WHERE idvendor = p_idvendor AND status = '1'
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor tidak ditemukan atau nonaktif.';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT jt.idbarang)
    INTO v_count, v_distinct
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah INT PATH '$.jumlah',
    harga_satuan INT PATH '$.harga_satuan'
  )) jt;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item pengadaan wajib diisi.';
  END IF;

  IF v_count <> v_distinct THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Barang duplikat dalam pengadaan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      idbarang INT PATH '$.idbarang',
      jumlah INT PATH '$.jumlah',
      harga_satuan INT PATH '$.harga_satuan'
    )) jt
    LEFT JOIN barang b ON b.idbarang = jt.idbarang
    WHERE jt.idbarang IS NULL
       OR jt.jumlah IS NULL OR jt.jumlah <= 0
       OR jt.harga_satuan IS NULL OR jt.harga_satuan < 0
       OR b.idbarang IS NULL OR b.status <> 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item pengadaan tidak valid.';
  END IF;

  SELECT COALESCE(SUM(jt.jumlah * jt.harga_satuan), 0)
    INTO v_subtotal
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah INT PATH '$.jumlah',
    harga_satuan INT PATH '$.harga_satuan'
  )) jt;

  INSERT INTO pengadaan (
    timestamp, user_iduser, status, vendor_idvendor,
    subtotal_nilai, ppn, total_nilai
  )
  VALUES (
    NOW(), p_iduser, 'P', p_idvendor,
    v_subtotal, p_ppn, v_subtotal + ROUND(v_subtotal * p_ppn / 100)
  );

  SET p_idpengadaan = LAST_INSERT_ID();

  INSERT INTO detail_pengadaan (
    harga_satuan, jumlah, sub_total, idbarang, idpengadaan
  )
  SELECT
    jt.harga_satuan,
    jt.jumlah,
    jt.jumlah * jt.harga_satuan,
    jt.idbarang,
    p_idpengadaan
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah INT PATH '$.jumlah',
    harga_satuan INT PATH '$.harga_satuan'
  )) jt;
END$$

DROP PROCEDURE IF EXISTS sp_pengadaan_status$$
CREATE PROCEDURE sp_pengadaan_status(
  IN p_idpengadaan BIGINT,
  IN p_status CHAR(1),
  IN p_actor INT,
  IN p_owner_only BOOLEAN,
  OUT p_idout BIGINT
)
BEGIN
  DECLARE v_status CHAR(1) DEFAULT NULL;
  DECLARE v_owner INT DEFAULT NULL;
  DECLARE v_receipts INT DEFAULT 0;

  SELECT status, user_iduser
    INTO v_status, v_owner
  FROM pengadaan
  WHERE idpengadaan = p_idpengadaan
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengadaan tidak ditemukan.';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('A', 'R', 'X') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Status hanya boleh A, R, atau X.';
  END IF;

  -- true hanya dikirim backend saat purchasing membatalkan draft miliknya.
  IF COALESCE(p_owner_only, FALSE)
     AND (v_owner <> p_actor OR v_status <> 'P' OR p_status <> 'X') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Hanya pengaju yang dapat membatalkan pengadaan berstatus Pending.';
  END IF;

  IF p_status IN ('A', 'R') THEN
    IF v_status <> 'P' THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Persetujuan hanya dari status Pending.';
    END IF;
  ELSEIF p_status = 'X' THEN
    IF v_status NOT IN ('P', 'A') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengadaan tidak bisa dibatalkan pada status ini.';
    END IF;

    SELECT COUNT(*)
      INTO v_receipts
    FROM penerimaan
    WHERE idpengadaan = p_idpengadaan;

    IF v_receipts > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengadaan sudah memiliki penerimaan.';
    END IF;
  END IF;

  UPDATE pengadaan
  SET status = p_status
  WHERE idpengadaan = p_idpengadaan;

  SET p_idout = p_idpengadaan;
END$$

-- Kebijakan harga sederhana: harga terima terakhir menimpa barang.harga.
-- Titik perubahan kebijakan: ganti isi procedure ini jika nanti memakai
-- riwayat harga atau rata-rata bergerak. Pemanggilnya tidak perlu diubah.
DROP PROCEDURE IF EXISTS sp_update_harga_dari_penerimaan$$
CREATE PROCEDURE sp_update_harga_dari_penerimaan(
  IN p_idpenerimaan BIGINT
)
BEGIN
  UPDATE barang b
  JOIN detail_penerimaan dp
    ON dp.barang_idbarang = b.idbarang
  SET b.harga = dp.harga_satuan_terima
  WHERE dp.idpenerimaan = p_idpenerimaan
    AND dp.harga_satuan_terima IS NOT NULL;
END$$

DROP PROCEDURE IF EXISTS sp_penerimaan_buat$$
CREATE PROCEDURE sp_penerimaan_buat(
  IN p_idpengadaan BIGINT,
  IN p_iduser INT,
  IN p_items JSON,
  OUT p_idpenerimaan BIGINT
)
BEGIN
  DECLARE v_status CHAR(1) DEFAULT NULL;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_distinct INT DEFAULT 0;
  DECLARE v_ordered INT DEFAULT 0;
  DECLARE v_received INT DEFAULT 0;
  DECLARE v_lock_item INT DEFAULT NULL;
  DECLARE v_items_done BOOLEAN DEFAULT FALSE;
  DECLARE cur_items CURSOR FOR
    SELECT jt.idbarang
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      idbarang INT PATH '$.idbarang'
    )) jt
    ORDER BY jt.idbarang;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_items_done = TRUE;

  IF p_items IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item penerimaan wajib diisi.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user WHERE iduser = p_iduser) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengguna tidak ditemukan.';
  END IF;

  SELECT status
    INTO v_status
  FROM pengadaan
  WHERE idpengadaan = p_idpengadaan
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengadaan tidak ditemukan.';
  END IF;

  IF v_status NOT IN ('A', 'S') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengadaan belum disetujui atau sudah selesai.';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT jt.idbarang)
    INTO v_count, v_distinct
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah_terima INT PATH '$.jumlah_terima'
  )) jt;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item penerimaan wajib diisi.';
  END IF;

  IF v_count <> v_distinct THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Barang duplikat dalam penerimaan.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      idbarang INT PATH '$.idbarang',
      jumlah_terima INT PATH '$.jumlah_terima'
    )) jt
    LEFT JOIN detail_pengadaan d
      ON d.idpengadaan = p_idpengadaan
     AND d.idbarang = jt.idbarang
    WHERE jt.idbarang IS NULL
       OR jt.jumlah_terima IS NULL OR jt.jumlah_terima <= 0
       OR d.iddetail_pengadaan IS NULL
       OR jt.jumlah_terima > COALESCE(d.jumlah, 0) - COALESCE((
            SELECT SUM(dp.jumlah_terima)
            FROM detail_penerimaan dp
            JOIN penerimaan p ON p.idpenerimaan = dp.idpenerimaan
            WHERE p.idpengadaan = p_idpengadaan
              AND dp.barang_idbarang = jt.idbarang
          ), 0)
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah terima melebihi sisa pengadaan.';
  END IF;

  -- Kunci baris barang dengan urutan tetap agar stok dan harga tidak balapan
  -- dengan penjualan/penerimaan lain untuk barang yang sama.
  OPEN cur_items;
  lock_items: LOOP
    FETCH cur_items INTO v_lock_item;
    IF v_items_done THEN
      LEAVE lock_items;
    END IF;
    SELECT idbarang INTO v_lock_item
    FROM barang
    WHERE idbarang = v_lock_item
    FOR UPDATE;
  END LOOP;
  CLOSE cur_items;

  INSERT INTO penerimaan (
    created_at, status, idpengadaan, iduser
  )
  VALUES (
    NOW(), 'S', p_idpengadaan, p_iduser
  );

  SET p_idpenerimaan = LAST_INSERT_ID();

  INSERT INTO detail_penerimaan (
    idpenerimaan, barang_idbarang, jumlah_terima,
    harga_satuan_terima, sub_total_terima
  )
  SELECT
    p_idpenerimaan,
    jt.idbarang,
    jt.jumlah_terima,
    d.harga_satuan,
    jt.jumlah_terima * d.harga_satuan
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah_terima INT PATH '$.jumlah_terima'
  )) jt
  JOIN detail_pengadaan d
    ON d.idpengadaan = p_idpengadaan
   AND d.idbarang = jt.idbarang;

  -- Kebijakan harga saat ini: harga terima terakhir menimpa barang.harga.
  -- Retur tidak mengembalikan harga lama.
  CALL sp_update_harga_dari_penerimaan(p_idpenerimaan);

  SELECT COALESCE(SUM(jumlah), 0)
    INTO v_ordered
  FROM detail_pengadaan
  WHERE idpengadaan = p_idpengadaan;

  SELECT COALESCE(SUM(dp.jumlah_terima), 0)
    INTO v_received
  FROM detail_penerimaan dp
  JOIN penerimaan p ON p.idpenerimaan = dp.idpenerimaan
  WHERE p.idpengadaan = p_idpengadaan;

  IF v_received >= v_ordered THEN
    UPDATE penerimaan SET status = 'C' WHERE idpenerimaan = p_idpenerimaan;
    UPDATE pengadaan SET status = 'C' WHERE idpengadaan = p_idpengadaan;
  ELSE
    UPDATE penerimaan SET status = 'S' WHERE idpenerimaan = p_idpenerimaan;
    UPDATE pengadaan SET status = 'S' WHERE idpengadaan = p_idpengadaan;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_retur_buat$$
CREATE PROCEDURE sp_retur_buat(
  IN p_idpenerimaan BIGINT,
  IN p_iduser INT,
  IN p_items JSON,
  OUT p_idretur BIGINT
)
BEGIN
  DECLARE v_status CHAR(1) DEFAULT NULL;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_distinct INT DEFAULT 0;

  IF p_items IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item retur wajib diisi.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user WHERE iduser = p_iduser) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengguna tidak ditemukan.';
  END IF;

  SELECT status
    INTO v_status
  FROM penerimaan
  WHERE idpenerimaan = p_idpenerimaan
  FOR UPDATE;

  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Penerimaan tidak ditemukan.';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT jt.iddetail_penerimaan)
    INTO v_count, v_distinct
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    iddetail_penerimaan BIGINT PATH '$.iddetail_penerimaan',
    jumlah INT PATH '$.jumlah',
    alasan VARCHAR(500) PATH '$.alasan'
  )) jt;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item retur wajib diisi.';
  END IF;

  IF v_count <> v_distinct THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item retur duplikat.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      iddetail_penerimaan BIGINT PATH '$.iddetail_penerimaan',
      jumlah INT PATH '$.jumlah',
      alasan VARCHAR(500) PATH '$.alasan'
    )) jt
    LEFT JOIN detail_penerimaan dp
      ON dp.iddetail_penerimaan = jt.iddetail_penerimaan
    WHERE jt.iddetail_penerimaan IS NULL
       OR jt.jumlah IS NULL OR jt.jumlah <= 0
       OR jt.alasan IS NULL
       OR CHAR_LENGTH(TRIM(jt.alasan)) = 0
       OR CHAR_LENGTH(jt.alasan) > 200
       OR dp.iddetail_penerimaan IS NULL
       OR dp.idpenerimaan <> p_idpenerimaan
       OR jt.jumlah > COALESCE(dp.jumlah_terima, 0) - COALESCE((
            SELECT SUM(dr.jumlah)
            FROM detail_retur dr
            WHERE dr.iddetail_penerimaan = jt.iddetail_penerimaan
          ), 0)
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Jumlah retur melebihi sisa terima atau data tidak valid.';
  END IF;

  INSERT INTO retur (
    created_at, idpenerimaan, iduser
  )
  VALUES (
    NOW(), p_idpenerimaan, p_iduser
  );

  SET p_idretur = LAST_INSERT_ID();

  INSERT INTO detail_retur (
    jumlah, alasan, idretur, iddetail_penerimaan
  )
  SELECT
    jt.jumlah,
    TRIM(jt.alasan),
    p_idretur,
    jt.iddetail_penerimaan
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    iddetail_penerimaan BIGINT PATH '$.iddetail_penerimaan',
    jumlah INT PATH '$.jumlah',
    alasan VARCHAR(500) PATH '$.alasan'
  )) jt;
END$$

DROP PROCEDURE IF EXISTS sp_penjualan_buat$$
CREATE PROCEDURE sp_penjualan_buat(
  IN p_iduser INT,
  IN p_idmargin_penjualan INT,
  IN p_ppn INT,
  IN p_items JSON,
  OUT p_idpenjualan INT
)
BEGIN
  DECLARE v_margin_status TINYINT DEFAULT NULL;
  DECLARE v_count INT DEFAULT 0;
  DECLARE v_subtotal INT DEFAULT 0;
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_idbarang INT DEFAULT NULL;
  DECLARE v_qty INT DEFAULT 0;
  DECLARE v_lock INT DEFAULT NULL;
  DECLARE v_harga INT DEFAULT 0;
  DECLARE done INT DEFAULT 0;

  DECLARE cur_items CURSOR FOR
    SELECT jt.idbarang, SUM(jt.jumlah)
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      idbarang INT PATH '$.idbarang',
      jumlah INT PATH '$.jumlah'
    )) jt
    GROUP BY jt.idbarang
    ORDER BY jt.idbarang;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  IF p_items IS NULL OR JSON_LENGTH(p_items) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item penjualan wajib diisi.';
  END IF;

  IF p_ppn IS NULL OR p_ppn < 0 OR p_ppn > 100 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'PPN harus 0 sampai 100 persen.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM user WHERE iduser = p_iduser) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pengguna tidak ditemukan.';
  END IF;

  SELECT status
    INTO v_margin_status
  FROM margin_penjualan
  WHERE idmargin_penjualan = p_idmargin_penjualan
  FOR UPDATE;

  IF v_margin_status IS NULL OR v_margin_status <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Margin penjualan aktif tidak ditemukan.';
  END IF;

  SELECT COUNT(*)
    INTO v_count
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah INT PATH '$.jumlah'
  )) jt;

  IF v_count = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item penjualan wajib diisi.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
      idbarang INT PATH '$.idbarang',
      jumlah INT PATH '$.jumlah'
    )) jt
    LEFT JOIN barang b ON b.idbarang = jt.idbarang
    WHERE jt.idbarang IS NULL
       OR jt.jumlah IS NULL OR jt.jumlah <= 0
       OR b.idbarang IS NULL OR b.status <> 1
  ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Item penjualan tidak valid.';
  END IF;

  OPEN cur_items;

  read_items: LOOP
    FETCH cur_items INTO v_idbarang, v_qty;

    IF done = 1 THEN
      LEAVE read_items;
    END IF;

    SELECT b.idbarang
      INTO v_lock
    FROM barang b
    WHERE b.idbarang = v_idbarang
    FOR UPDATE;

    IF fn_stok_terkini(v_idbarang) < v_qty THEN
      CLOSE cur_items;
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stok tidak mencukupi.';
    END IF;

    SET v_harga = fn_harga_jual(v_idbarang, p_idmargin_penjualan);
    SET v_subtotal = v_subtotal + (v_harga * v_qty);
  END LOOP;

  CLOSE cur_items;

  SET v_total = v_subtotal + ROUND(v_subtotal * p_ppn / 100);

  INSERT INTO penjualan (
    created_at, subtotal_nilai, ppn, total_nilai, iduser, idmargin_penjualan
  )
  VALUES (
    NOW(), v_subtotal, p_ppn, v_total, p_iduser, p_idmargin_penjualan
  );

  SET p_idpenjualan = LAST_INSERT_ID();

  INSERT INTO detail_penjualan (
    harga_satuan, jumlah, subtotal, penjualan_idpenjualan, idbarang
  )
  SELECT
    fn_harga_jual(jt.idbarang, p_idmargin_penjualan),
    SUM(jt.jumlah),
    fn_harga_jual(jt.idbarang, p_idmargin_penjualan) * SUM(jt.jumlah),
    p_idpenjualan,
    jt.idbarang
  FROM JSON_TABLE(p_items, '$[*]' COLUMNS (
    idbarang INT PATH '$.idbarang',
    jumlah INT PATH '$.jumlah'
  )) jt
  GROUP BY jt.idbarang;
END$$

DELIMITER ;
