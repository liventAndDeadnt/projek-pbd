package identity

// AuthUser = data user yang aman dikirim ke client (tanpa password).
type AuthUser struct {
	IDUser   int    `json:"iduser"`
	Username string `json:"username"`
	Role     string `json:"role"`
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
