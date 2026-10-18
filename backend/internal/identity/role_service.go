package identity

import "context"

type RoleService struct {
	repo *RoleRepository
}

func NewRoleService(repo *RoleRepository) *RoleService {
	return &RoleService{repo: repo}
}

func (s *RoleService) List(ctx context.Context, f RoleFilter) ([]Role, error) {
	return s.repo.List(ctx, f)
}
