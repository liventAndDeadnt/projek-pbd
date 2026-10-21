package identity

// AuthUser = data user yang aman dikirim ke client (tanpa password).
type AuthUser struct {
	IDUser   int    `json:"iduser"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// UserView adalah data aman untuk daftar pengguna (tanpa password).
type UserView struct {
	IDUser   int    `db:"iduser" json:"iduser"`
	Username string `db:"username" json:"username"`
	IDRole   int    `db:"idrole" json:"idrole"`
	Role     string `db:"nama_role" json:"role"`
}

// User adalah model internal untuk menulis akun. Password selalu berisi hash dan tidak dikirim ke client.
type User struct {
	IDUser   int    `db:"iduser" json:"iduser"`
	Username string `db:"username" json:"username"`
	IDRole   int    `db:"idrole" json:"idrole"`
	Password string `db:"password" json:"-"`
}

// UserFilter berisi filter opsional untuk daftar pengguna.
type UserFilter struct {
	Search string
	Role   string
}

type LoginInput struct {
	Username string `json:"username" binding:"required,max=45"`
	Password string `json:"password" binding:"required,max=100"`
}

// userRecord hanya dipakai di dalam package ini (berisi hash password, tidak pernah di-JSON-kan).
type userRecord struct {
	IDUser   int    `db:"iduser"`
	Username string `db:"username"`
	Password string `db:"password"`
	NamaRole string `db:"nama_role"`
}

type UserCreateInput struct {
	Username string `json:"username" binding:"required,max=45"`
	IDRole   int    `json:"idrole" binding:"required,gt=0"`
	Password string `json:"password" binding:"required,max=100"`
}

// Password boleh tidak dikirim ketika update agar perubahan nama/role tidak mereset password.
type UserUpdateInput struct {
	Username string  `json:"username" binding:"required,max=45"`
	IDRole   int     `json:"idrole" binding:"required,gt=0"`
	Password *string `json:"password" binding:"omitempty,max=100"`
}
