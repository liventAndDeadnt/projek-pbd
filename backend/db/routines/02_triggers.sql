-- Trigger kartu stok.
-- Jalankan setelah 01_functions.sql karena memakai fn_stok_terkini.
-- Semua penulisan detail transaksi harus lewat stored procedure agar stok konsisten.

DELIMITER $$

DROP TRIGGER IF EXISTS trg_penerimaan_stok$$
CREATE TRIGGER trg_penerimaan_stok
AFTER INSERT ON detail_penerimaan
FOR EACH ROW
BEGIN
  INSERT INTO kartu_stok (
    jenis_transaksi, masuk, keluar, stock, created_at, idtransaksi, idbarang
  )
  VALUES (
    'M',
    COALESCE(NEW.jumlah_terima, 0),
    0,
    fn_stok_terkini(NEW.barang_idbarang) + COALESCE(NEW.jumlah_terima, 0),
    NOW(),
    NEW.idpenerimaan,
    NEW.barang_idbarang
  );
END$$

DROP TRIGGER IF EXISTS trg_penjualan_stok$$
CREATE TRIGGER trg_penjualan_stok
AFTER INSERT ON detail_penjualan
FOR EACH ROW
BEGIN
  INSERT INTO kartu_stok (
    jenis_transaksi, masuk, keluar, stock, created_at, idtransaksi, idbarang
  )
  VALUES (
    'J',
    0,
    COALESCE(NEW.jumlah, 0),
    fn_stok_terkini(NEW.idbarang) - COALESCE(NEW.jumlah, 0),
    NOW(),
    NEW.penjualan_idpenjualan,
    NEW.idbarang
  );
END$$

DROP TRIGGER IF EXISTS trg_retur_stok$$
CREATE TRIGGER trg_retur_stok
AFTER INSERT ON detail_retur
FOR EACH ROW
BEGIN
  DECLARE v_idbarang INT DEFAULT NULL;

  SELECT dp.barang_idbarang
    INTO v_idbarang
  FROM detail_penerimaan dp
  WHERE dp.iddetail_penerimaan = NEW.iddetail_penerimaan;

  INSERT INTO kartu_stok (
    jenis_transaksi, masuk, keluar, stock, created_at, idtransaksi, idbarang
  )
  VALUES (
    'R',
    0,
    COALESCE(NEW.jumlah, 0),
    fn_stok_terkini(v_idbarang) - COALESCE(NEW.jumlah, 0),
    NOW(),
    NEW.idretur,
    v_idbarang
  );
END$$

DELIMITER ;
