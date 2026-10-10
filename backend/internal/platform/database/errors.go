package database

import (
	"database/sql"
	"errors"

	"github.com/go-sql-driver/mysql"

	"projek_pbd_go/internal/platform/apperr"
)

const (
	errDuplicateEntry   = 1062 // nilai UNIQUE kembar
	errFKParentRestrict = 1451 // hapus/ubah baris induk yang masih dipakai tabel anak
	errFKChildMissing   = 1452 // isi FK yang menunjuk ke baris induk yang tidak ada
)

func IsDuplicate(err error) bool  { return mysqlErrNumber(err) == errDuplicateEntry }
func IsFKRestrict(err error) bool { return mysqlErrNumber(err) == errFKParentRestrict }
func IsFKMissing(err error) bool  { return mysqlErrNumber(err) == errFKChildMissing }

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
