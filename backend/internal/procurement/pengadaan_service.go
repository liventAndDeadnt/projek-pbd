package procurement

import (
	"context"
	"strings"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/auth"
)

type PengadaanService struct {
	repo *PengadaanRepository
}

func NewPengadaanService(repo *PengadaanRepository) *PengadaanService {
	return &PengadaanService{repo: repo}
}

func (s *PengadaanService) List(ctx context.Context, f PengadaanFilter) ([]Pengadaan, error) {
	return s.repo.List(ctx, f)
}

func (s *PengadaanService) Get(
	ctx context.Context,
	actorID int,
	role string,
	id int64,
) (*PengadaanDetail, error) {
	detail, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	detail.Permissions = permissionsFor(detail, actorID, role)
	return detail, nil
}

func (s *PengadaanService) Create(
	ctx context.Context,
	actorID int,
	role string,
	in CreateInput,
) (*PengadaanDetail, error) {
	if err := validateCreate(in); err != nil {
		return nil, err
	}
	id, err := s.repo.Create(ctx, actorID, in.IDVendor, in.PPN, in.Items)
	if err != nil {
		return nil, err
	}
	return s.Get(ctx, actorID, role, id)
}

func (s *PengadaanService) ChangeStatus(
	ctx context.Context,
	actorID int,
	role string,
	id int64,
	status string,
) (*PengadaanDetail, error) {
	status = strings.ToUpper(strings.TrimSpace(status))
	current, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	ownerOnly := false
	switch status {
	case "A", "R":
		if role != auth.RoleAdmin {
			return nil, apperr.Wrap(apperr.ErrForbidden,
				"Hanya admin yang dapat menyetujui atau menolak pengadaan.")
		}
		if current.Status != "P" {
			return nil, apperr.Wrap(apperr.ErrConflict,
				"Pengadaan hanya dapat diputuskan saat masih Pending.")
		}
	case "X":
		switch role {
		case auth.RoleAdmin:
			if current.JumlahPenerimaan > 0 {
				return nil, apperr.Wrap(apperr.ErrConflict,
					"Pengadaan sudah memiliki penerimaan dan tidak bisa dibatalkan.")
			}
			if current.Status != "P" && current.Status != "A" {
				return nil, apperr.Wrap(apperr.ErrConflict,
					"Pengadaan tidak bisa dibatalkan pada status ini.")
			}
		case auth.RolePurchasing:
			if current.IDUser != actorID {
				return nil, apperr.Wrap(apperr.ErrForbidden,
					"Anda hanya dapat membatalkan pengadaan yang Anda ajukan.")
			}
			if current.Status != "P" {
				return nil, apperr.Wrap(apperr.ErrConflict,
					"Pengadaan hanya dapat dibatalkan saat masih Pending.")
			}
			if current.JumlahPenerimaan > 0 {
				return nil, apperr.Wrap(apperr.ErrConflict,
					"Pengadaan sudah memiliki penerimaan dan tidak bisa dibatalkan.")
			}
			ownerOnly = true
		default:
			return nil, apperr.ErrForbidden
		}
	default:
		return nil, apperr.Wrap(apperr.ErrInvalid, "Status pengadaan tidak valid.")
	}

	if err := s.repo.ChangeStatus(ctx, id, status, actorID, ownerOnly); err != nil {
		return nil, err
	}
	return s.Get(ctx, actorID, role, id)
}

func validateCreate(in CreateInput) error {
	if in.IDVendor <= 0 {
		return apperr.Wrap(apperr.ErrInvalid, "Vendor wajib dipilih.")
	}
	if in.PPN < 0 || in.PPN > 100 {
		return apperr.Wrap(apperr.ErrInvalid, "PPN harus 0 sampai 100 persen.")
	}
	if len(in.Items) == 0 {
		return apperr.Wrap(apperr.ErrInvalid, "Item pengadaan wajib diisi.")
	}

	seen := make(map[int]struct{}, len(in.Items))
	for _, item := range in.Items {
		if item.IDBarang <= 0 {
			return apperr.Wrap(apperr.ErrInvalid, "Barang pada setiap baris wajib dipilih.")
		}
		if item.Jumlah <= 0 {
			return apperr.Wrap(apperr.ErrInvalid, "Jumlah barang harus lebih dari 0.")
		}
		if item.HargaSatuan < 0 {
			return apperr.Wrap(apperr.ErrInvalid, "Harga satuan tidak boleh negatif.")
		}
		if _, exists := seen[item.IDBarang]; exists {
			return apperr.Wrap(apperr.ErrInvalid, "Barang yang sama tidak boleh dipilih dua kali.")
		}
		seen[item.IDBarang] = struct{}{}
	}
	return nil
}

// permissionsFor adalah satu-satunya tempat aturan tombol aksi ditentukan.
func permissionsFor(detail *PengadaanDetail, actorID int, role string) Permissions {
	var p Permissions

	if role == auth.RoleAdmin {
		switch detail.Status {
		case "P":
			p.Approve = true
			p.Reject = true
			p.Cancel = detail.JumlahPenerimaan == 0
		case "A":
			p.Cancel = detail.JumlahPenerimaan == 0
		}
		return p
	}

	if role == auth.RolePurchasing &&
		detail.Status == "P" &&
		detail.IDUser == actorID {
		p.Cancel = detail.JumlahPenerimaan == 0
	}
	return p
}
