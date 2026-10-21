package catalog

import (
	"context"
	"strings"
)

const statusAktif = 1

// SatuanService: aturan bisnis (normalisasi input, default). Belum ada transaksi di sini.
type SatuanService struct {
	repo *SatuanRepository
}

func NewSatuanService(repo *SatuanRepository) *SatuanService {
	return &SatuanService{repo: repo}
}

func (s *SatuanService) List(ctx context.Context, f SatuanFilter) ([]Satuan, error) {
	return s.repo.List(ctx, f)
}

func (s *SatuanService) Get(ctx context.Context, id int) (*Satuan, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *SatuanService) Create(ctx context.Context, in SatuanInput) (*Satuan, error) {
	id, err := s.repo.Create(ctx, strings.TrimSpace(in.NamaSatuan), statusOrDefault(in.Status))
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *SatuanService) Update(ctx context.Context, id int, in SatuanInput) (*Satuan, error) {
	if err := s.repo.Update(ctx, id, strings.TrimSpace(in.NamaSatuan), statusOrDefault(in.Status)); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *SatuanService) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func statusOrDefault(p *int) int {
	if p == nil {
		return statusAktif
	}
	return *p
}
