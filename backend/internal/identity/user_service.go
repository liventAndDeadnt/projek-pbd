package identity

import (
	"context"
	"strings"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/auth"
)

type UserService struct {
	repo *UserRepository
}

func NewUserService(repo *UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) List(ctx context.Context, f UserFilter) ([]UserView, error) {
	return s.repo.List(ctx, f)
}

func (s *UserService) Get(ctx context.Context, id int) (*UserView, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) Create(ctx context.Context, in UserCreateInput) (*UserView, error) {
	username := strings.TrimSpace(in.Username)
	if username == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Username wajib diisi.")
	}
	if in.Password == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Password wajib diisi.")
	}
	if err := s.ensureUsernameAvailable(ctx, username, 0); err != nil {
		return nil, err
	}

	user := User{
		Username: username,
		IDRole:   in.IDRole,
		Password: hashPassword(in.Password),
	}
	id, err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) Update(ctx context.Context, id int, in UserUpdateInput) (*UserView, error) {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	username := strings.TrimSpace(in.Username)
	if username == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Username wajib diisi.")
	}
	if in.Password != nil && *in.Password == "" {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Password tidak boleh kosong.")
	}
	if err := s.ensureUsernameAvailable(ctx, username, id); err != nil {
		return nil, err
	}
	newRole, err := s.repo.GetRoleName(ctx, in.IDRole)
	if err != nil {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Role yang dipilih tidak ditemukan.")
	}
	if strings.EqualFold(current.Role, auth.RoleAdmin) && !strings.EqualFold(newRole, auth.RoleAdmin) {
		if err := s.ensureAnotherAdminRemains(ctx); err != nil {
			return nil, err
		}
	}

	user := User{
		IDUser:   id,
		Username: username,
		IDRole:   in.IDRole,
	}
	updatePassword := in.Password != nil
	if updatePassword {
		user.Password = hashPassword(*in.Password)
	}
	if err := s.repo.Update(ctx, user, updatePassword); err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}

func (s *UserService) Delete(ctx context.Context, id int) error {
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if strings.EqualFold(current.Role, auth.RoleAdmin) {
		if err := s.ensureAnotherAdminRemains(ctx); err != nil {
			return err
		}
	}
	return s.repo.Delete(ctx, id)
}

func (s *UserService) ensureUsernameAvailable(ctx context.Context, username string, excludeID int) error {
	exists, err := s.repo.ExistsByUsername(ctx, username, excludeID)
	if err != nil {
		return err
	}
	if exists {
		return apperr.Wrap(apperr.ErrConflict, "Username sudah digunakan.")
	}
	return nil
}

func (s *UserService) ensureAnotherAdminRemains(ctx context.Context) error {
	count, err := s.repo.CountByRole(ctx, auth.RoleAdmin)
	if err != nil {
		return err
	}
	if count <= 1 {
		return apperr.Wrap(apperr.ErrConflict, "Akun admin terakhir tidak bisa dihapus atau diturunkan rolenya.")
	}
	return nil
}
