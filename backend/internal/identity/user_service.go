package identity

import "context"

type UserService struct {
	repo *UserRepository
}

func NewUserService(repo *UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) List(ctx context.Context, f UserFilter) ([]UserView, error) {
	return s.repo.List(ctx, f)
}
