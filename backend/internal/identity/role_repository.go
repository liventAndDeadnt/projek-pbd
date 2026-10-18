package identity

import (
	"context"
	"strings"

	"github.com/jmoiron/sqlx"
)

const selectRole = `
SELECT * FROM v_role_detail`

type RoleRepository struct {
	db *sqlx.DB
}

func NewRoleRepository(db *sqlx.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) List(ctx context.Context, f RoleFilter) ([]Role, error) {
	query := selectRole
	var conds []string
	var args []any

	if f.Search != "" {
		conds = append(conds, "nama_role LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}

	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY idrole"

	out := []Role{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}
