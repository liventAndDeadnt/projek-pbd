-- Function MySQL untuk alur transaksi.
-- Jalankan lebih dulu sebelum 02_triggers.sql dan 03_procedures.sql.
-- File ini untuk mysql CLI (memakai DELIMITER), bukan migration runner Go.

DELIMITER $$

DROP FUNCTION IF EXISTS fn_stok_terkini$$
CREATE FUNCTION fn_stok_terkini(p_idbarang INT)
RETURNS INT
READS SQL DATA
BEGIN
  DECLARE v_stock INT DEFAULT 0;

  SELECT COALESCE(stock, 0)
    INTO v_stock
  FROM kartu_stok
  WHERE idbarang = p_idbarang
  ORDER BY idkartu_stok DESC
  LIMIT 1;

  RETURN COALESCE(v_stock, 0);
END$$

DROP FUNCTION IF EXISTS fn_harga_jual$$
CREATE FUNCTION fn_harga_jual(p_idbarang INT, p_idmargin_penjualan INT)
RETURNS INT
READS SQL DATA
BEGIN
  DECLARE v_harga INT DEFAULT NULL;

  SELECT ROUND(b.harga * (1 + COALESCE(m.persen, 0) / 100))
    INTO v_harga
  FROM barang b
  JOIN margin_penjualan m
    ON m.idmargin_penjualan = p_idmargin_penjualan
  WHERE b.idbarang = p_idbarang;

  RETURN v_harga;
END$$

DELIMITER ;
