package catalog

import "time"

type Margin struct {
	IDMarginPenjualan int        `db:"idmargin_penjualan" json:"idmargin_penjualan"`
	Persen            *float64   `db:"persen" json:"persen"`
	Status            *int       `db:"status" json:"status"`
	CreatedAt         *time.Time `db:"created_at" json:"created_at"`
}

type MarginFilter struct {
	Status *int
}
