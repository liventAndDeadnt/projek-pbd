package procurement

import (
	"context"

	"projek-pbd/internal/platform/apperr"
)

type PenerimaanService struct {
	repo *PenerimaanRepository
}

func NewPenerimaanService(repo *PenerimaanRepository) *PenerimaanService {
	return &PenerimaanService{repo: repo}
}

func (s *PenerimaanService) List(ctx context.Context, f PenerimaanFilter) ([]Penerimaan, error) {
	return s.repo.List(ctx, f)
}

func (s *PenerimaanService) Get(ctx context.Context, id int64) (*PenerimaanDetail, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *PenerimaanService) Create(
	ctx context.Context,
	actorID int,
	in CreatePenerimaanInput,
) (*PenerimaanDetail, error) {
	if in.IDPengadaan <= 0 {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Pengadaan wajib dipilih.")
	}
	if len(in.Items) == 0 {
		return nil, apperr.Wrap(apperr.ErrInvalid, "Item penerimaan wajib diisi.")
	}

	seen := make(map[int]struct{}, len(in.Items))
	for _, item := range in.Items {
		if item.IDBarang <= 0 {
			return nil, apperr.Wrap(apperr.ErrInvalid, "Barang pada setiap baris wajib dipilih.")
		}
		if item.JumlahTerima <= 0 {
			return nil, apperr.Wrap(apperr.ErrInvalid, "Jumlah terima harus lebih dari 0.")
		}
		if _, ok := seen[item.IDBarang]; ok {
			return nil, apperr.Wrap(apperr.ErrInvalid, "Barang yang sama tidak boleh dipilih dua kali.")
		}
		seen[item.IDBarang] = struct{}{}
	}

	id, err := s.repo.Create(ctx, actorID, in.IDPengadaan, in.Items)
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(ctx, id)
}
