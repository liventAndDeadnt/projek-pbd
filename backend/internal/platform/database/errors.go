package database

import (
	"database/sql"
	"errors"

	"github.com/go-sql-driver/mysql"

	"projek-pbd/internal/platform/apperr"
)

const (
	errDuplicateEntry   = 1062 // nilai UNIQUE kembar
	errFKParentRestrict = 1451 // hapus/ubah baris induk yang masih dipakai tabel anak
	errFKChildMissing   = 1452 // isi FK yang menunjuk ke baris induk yang tidak ada
	errRuleViolation    = 1644 // SIGNAL SQLSTATE '45000' dari stored procedure
)

func IsDuplicate(err error) bool  { return mysqlErrNumber(err) == errDuplicateEntry }
func IsFKRestrict(err error) bool { return mysqlErrNumber(err) == errFKParentRestrict }
func IsFKMissing(err error) bool  { return mysqlErrNumber(err) == errFKChildMissing }

// IsRuleViolation menandai penolakan aturan bisnis dari stored procedure.
func IsRuleViolation(err error) bool { return mysqlErrNumber(err) == errRuleViolation }

// RuleMessage mengambil pesan SIGNAL agar bisa ditampilkan apa adanya ke pengguna.
func RuleMessage(err error) string {
	var me *mysql.MySQLError
	if errors.As(err, &me) && me.Message != "" {
		return me.Message
	}
	return "Data tidak valid."
}

func mysqlErrNumber(err error) uint16 {
	var me *mysql.MySQLError
	if errors.As(err, &me) {
		return me.Number
	}
	return 0
}

// RequireAffected mengembalikan ErrNotFound bila tidak ada baris yang terkena.
func RequireAffected(res sql.Result) error {
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return apperr.ErrNotFound
	}
	return nil
}
