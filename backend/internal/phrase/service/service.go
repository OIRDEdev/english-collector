package service

import (
	"extension-backend/internal/phrase"
)

// Service gerencia a lógica de negócio para frases
type Service struct {
	repo phrase.RepositoryInterface
}

// New cria uma nova instância do serviço
func New(repo phrase.RepositoryInterface) *Service {
	return &Service{repo: repo}
}
