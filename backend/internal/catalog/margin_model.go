package catalog

import "time"

type Margin struct {
	IDMarginPenjualan int        `db:"idmargin_penjualan" json:"idmargin_penjualan"`
	IDUser            int        `db:"iduser" json:"-"`
	Persen            *float64   `db:"persen" json:"persen"`
	Status            *int       `db:"status" json:"status"`
	CreatedAt         *time.Time `db:"created_at" json:"created_at"`
}

type MarginFilter struct {
	Status *int
}

type MarginView struct {
	Margin
	Username string `db:"username" json:"username"`
}

type MarginInput struct {
	Persen *float64 `json:"persen" binding:"required,gte=0,lte=100"`
	Status *int     `json:"status" binding:"required,oneof=0 1"`
}
