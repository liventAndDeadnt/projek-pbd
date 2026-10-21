package catalog

import (
	"context"
	"strings"

	"projek-pbd/internal/platform/apperr"
)

// VendorService menjadi perantara aturan aplikasi antara handler dan repository.
type VendorService struct {
	repo *VendorRepository
}

func NewVendorService(repo *VendorRepository) *VendorService {
	return &VendorService{repo: repo}
}

func (s *VendorService) List(ctx context.Context, f VendorFilter) ([]Vendor, error) {
	return s.repo.List(ctx, f)
}

func (s *VendorService) Get(ctx context.Context, id int) (*Vendor, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *VendorService) Create(ctx context.Context, in VendorInput) (*Vendor, error) {
	if strings.TrimSpace(in.NamaVendor) == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Nama vendor wajib diisi.")
	}
	id, err := s.repo.Create(ctx, toVendor(0, in))
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *VendorService) Update(ctx context.Context, id int, in VendorInput) (*Vendor, error) {
	if strings.TrimSpace(in.NamaVendor) == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Nama vendor wajib diisi.")
	}
	if err := s.repo.Update(ctx, toVendor(id, in)); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *VendorService) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func toVendor(id int, in VendorInput) Vendor {
	return Vendor{
		IDVendor:   id,
		NamaVendor: strings.TrimSpace(in.NamaVendor),
		BadanHukum: strings.TrimSpace(in.BadanHukum),
		Status:     strings.TrimSpace(in.Status),
	}
}
