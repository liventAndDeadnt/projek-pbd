package catalog

import "context"

type MarginService struct {
	repo *MarginRepository
}

func NewMarginService(repo *MarginRepository) *MarginService {
	return &MarginService{repo: repo}
}

func (s *MarginService) List(ctx context.Context, f MarginFilter) ([]MarginView, error) {
	return s.repo.List(ctx, f)
}

func (s *MarginService) Get(ctx context.Context, id int) (*MarginView, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *MarginService) Create(ctx context.Context, userID int, in MarginInput) (*MarginView, error) {
	margin := toMargin(0, in)
	margin.IDUser = userID
	id, err := s.repo.Create(ctx, margin)
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *MarginService) Update(ctx context.Context, id int, in MarginInput) (*MarginView, error) {
	if err := s.repo.Update(ctx, toMargin(id, in)); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *MarginService) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func toMargin(id int, in MarginInput) Margin {
	return Margin{
		IDMarginPenjualan: id,
		Persen:            in.Persen,
		Status:            in.Status,
	}
}
