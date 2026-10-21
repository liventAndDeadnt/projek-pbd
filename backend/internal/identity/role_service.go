package identity

import (
	"context"
	"strings"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/auth"
)

type RoleService struct {
	repo *RoleRepository
}

func NewRoleService(repo *RoleRepository) *RoleService {
	return &RoleService{repo: repo}
}

func (s *RoleService) List(ctx context.Context, f RoleFilter) ([]Role, error) {
	return s.repo.List(ctx, f)
}

func (s *RoleService) Get(ctx context.Context, id int) (*Role, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *RoleService) Create(ctx context.Context, in RoleInput) (*Role, error) {
	name := strings.ToLower(strings.TrimSpace(in.NamaRole))
	if name == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Nama role wajib diisi.")
	}
	if err := s.ensureNameAvailable(ctx, name, 0); err != nil {
		return nil, err
	}
	id, err := s.repo.Create(ctx, toRole(0, RoleInput{NamaRole: name}))
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *RoleService) Update(ctx context.Context, id int, in RoleInput) (*Role, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	name := strings.ToLower(strings.TrimSpace(in.NamaRole))
	if name == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Nama role wajib diisi.")
	}
	if isSystemRole(current.NamaRole) && name != strings.ToLower(strings.TrimSpace(current.NamaRole)) {
		return nil, apperr.Wrap(apperr.ErrConflict, "Nama role bawaan aplikasi tidak bisa diubah.")
	}
	if err := s.ensureNameAvailable(ctx, name, id); err != nil {
		return nil, err
	}
	if err := s.repo.Update(ctx, toRole(id, RoleInput{NamaRole: name})); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *RoleService) Delete(ctx context.Context, id int) error {
	role, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if isSystemRole(role.NamaRole) {
		return apperr.Wrap(apperr.ErrConflict, "Role bawaan aplikasi tidak bisa dihapus.")
	}
	return s.repo.Delete(ctx, id)
}

func toRole(id int, in RoleInput) Role {
	return Role{
		IDRole:   id,
		NamaRole: strings.TrimSpace(in.NamaRole),
	}
}

func (s *RoleService) ensureNameAvailable(ctx context.Context, name string, excludeID int) error {
	exists, err := s.repo.ExistsByName(ctx, name, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return apperr.Wrap(apperr.ErrConflict, "Nama role sudah digunakan.")
	}
	return nil
}

func isSystemRole(name string) bool {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case auth.RoleAdmin, auth.RolePurchasing, auth.RoleGudang, auth.RoleKasir:
		return true
	default:
		return false
	}
}
