package catalog

import "context"

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
