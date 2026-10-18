package catalog

import "context"

type MarginService struct {
	repo *MarginRepository
}

func NewMarginService(repo *MarginRepository) *MarginService {
	return &MarginService{repo: repo}
}

func (s *MarginService) List(ctx context.Context, f MarginFilter) ([]Margin, error) {
	return s.repo.List(ctx, f)
}

func (s *MarginService) Get(ctx context.Context, id int) (*Margin, error) {
	return s.repo.GetByID(ctx, id)
}