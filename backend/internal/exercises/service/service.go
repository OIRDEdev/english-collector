package service

import (
	"context"
	"fmt"
	"strings"

	"extension-backend/internal/exercises"
)

type Service struct {
	repo exercises.RepositoryInterface
}

func New(repo exercises.RepositoryInterface) *Service {
	return &Service{repo: repo}
}

// GetByID busca um exercício por ID
func (s *Service) GetByID(ctx context.Context, id int) (*exercises.Exercicio, error) {
	ex, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("exercise not found: %w", err)
	}
	return ex, nil
}

// ListGrouped retorna exercícios agrupados por tipo para o frontend
func (s *Service) ListGrouped(ctx context.Context, userID int) ([]exercises.ExerciseGroup, error) {
	all, err := s.repo.GetAllForUser(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list exercises: %w", err)
	}

	// Agrupar por tipo_componente
	groupMap := make(map[string]*exercises.ExerciseGroup)
	groupOrder := []string{}

	for _, ex := range all {
		tipoFrontend := mapTipoToFrontend(ex.TipoComponente)

		grp, exists := groupMap[tipoFrontend]
		if !exists {
			origem := "global"
			if ex.UsuarioID != nil {
				origem = "personalizado"
			}
			grp = &exercises.ExerciseGroup{
				Tipo:   tipoFrontend,
				Origem: origem,
				Data:   []exercises.Exercicio{},
			}
			groupMap[tipoFrontend] = grp
			groupOrder = append(groupOrder, tipoFrontend)
		}

		// Se algum exercício do grupo for personalizado, marcar como personalizado
		if ex.UsuarioID != nil {
			grp.Origem = "personalizado"
		}

		grp.Data = append(grp.Data, ex)
	}

	// Manter ordem de inserção
	result := make([]exercises.ExerciseGroup, 0, len(groupOrder))
	for _, tipo := range groupOrder {
		result = append(result, *groupMap[tipo])
	}

	return result, nil
}

// GetByType retorna exercícios filtrados por tipo
func (s *Service) GetByType(ctx context.Context, userID int, tipo string) ([]exercises.Exercicio, error) {
	// Mapear tipo do frontend para o backend se necessário
	tipoBackend := mapTipoToBackend(tipo)

	exs, err := s.repo.GetByType(ctx, tipoBackend, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get exercises by type: %w", err)
	}
	if exs == nil {
		exs = []exercises.Exercicio{}
	}
	return exs, nil
}

// mapTipoToFrontend converte nomes do banco para nomes do frontend
func mapTipoToFrontend(tipo string) string {
	switch strings.ToLower(tipo) {
	case "claritysprint":
		return "Clarity"
	case "echowrite":
		return "Echo"
	case "nexusconnect":
		return "Nexus"
	case "logicbreaker":
		return "Logic"
	case "keyburst":
		return "Key"
	case "historia":
		return "Historia"
	default:
		return tipo
	}
}

// mapTipoToBackend converte nomes do frontend para nomes do banco
func mapTipoToBackend(tipo string) string {
	switch strings.ToLower(tipo) {
	case "clarity":
		return "ClaritySprint"
	case "echo":
		return "EchoWrite"
	case "nexus":
		return "NexusConnect"
	case "logic":
		return "LogicBreaker"
	case "key":
		return "KeyBurst"
	case "historia":
		return "historia"
	default:
		return tipo
	}
}
