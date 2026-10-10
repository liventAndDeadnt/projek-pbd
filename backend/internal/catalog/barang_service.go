package catalog

import (
	"context"
	"strings"
)

type BarangService struct {
	repo *BarangRepository
}

func NewBarangService(repo *BarangRepository) *BarangService {
	return &BarangService{repo: repo}
}

func (s *BarangService) List(ctx context.Context, f BarangFilter) ([]BarangView, error) {
	return s.repo.List(ctx, f)
}

func (s *BarangService) Get(ctx context.Context, id int) (*BarangView, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *BarangService) Create(ctx context.Context, in BarangInput) (*BarangView, error) {
	id, err := s.repo.Create(ctx, toBarang(0, in))
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *BarangService) Update(ctx context.Context, id int, in BarangInput) (*BarangView, error) {
	if err := s.repo.Update(ctx, toBarang(id, in)); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *BarangService) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func toBarang(id int, in BarangInput) Barang {
	return Barang{
		IDBarang: id,
		Jenis:    strings.TrimSpace(in.Jenis),
		Nama:     strings.TrimSpace(in.Nama),
		IDSatuan: in.IDSatuan,
		Status:   statusOrDefault(in.Status),
		Harga:    *in.Harga, // dijamin non-nil oleh binding:"required"
	}
}
