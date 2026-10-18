package identity

type Role struct {
	IDRole   int    `db:"idrole" json:"idrole"`
	NamaRole string `db:"nama_role" json:"nama_role"`
}

type RoleFilter struct {
	Search string
}
