package settings

import (
	"context"
	"fmt"

	"extension-backend/internal/settings/repository"
)

// Service gerencia a lógica de negócio das configurações do usuário
type Service struct {
	repo *repository.Repository
}

// NewService cria uma nova instância do Service
func NewService(repo *repository.Repository) *Service {
	return &Service{repo: repo}
}

// GetSettings retorna as configurações do usuário
func (s *Service) GetSettings(ctx context.Context, userID int) (*repository.UserSettings, error) {
	settings, err := s.repo.GetByUserID(ctx, userID)
	if err != nil {
		// Retorna defaults se não existir
		return &repository.UserSettings{
			UsuarioID:            userID,
			IdiomaPadraoTraducao: "pt-BR",
			AutoTraduzir:         false,
			TemaInterface:        "dark",
			NivelProficiencia:    "intermediate",
			MinutosDiarios:       15,
			CardsDiarios:         10,
			OnboardingCompleto:   false,
			Config:               make(map[string]any),
		}, nil
	}
	return settings, nil
}

// UpdateSettings atualiza as configurações do usuário (chamado pelo SettingsModal)
func (s *Service) UpdateSettings(ctx context.Context, input repository.UpdateSettingsInput) (*repository.UserSettings, error) {
	// Buscar settings atuais ou criar defaults
	current, _ := s.repo.GetByUserID(ctx, input.UserID)

	if current == nil {
		current = &repository.UserSettings{
			UsuarioID:            input.UserID,
			IdiomaPadraoTraducao: "pt-BR",
			AutoTraduzir:         false,
			TemaInterface:        "dark",
			NivelProficiencia:    "intermediate",
			MinutosDiarios:       15,
			CardsDiarios:         10,
			Config:               make(map[string]any),
		}
	}

	// Partial update: só atualiza campos que foram enviados
	if input.IdiomaPadraoTraducao != nil {
		current.IdiomaPadraoTraducao = *input.IdiomaPadraoTraducao
	}
	if input.AutoTraduzir != nil {
		current.AutoTraduzir = *input.AutoTraduzir
	}
	if input.TemaInterface != nil {
		current.TemaInterface = *input.TemaInterface
	}
	if input.NivelProficiencia != nil {
		current.NivelProficiencia = *input.NivelProficiencia
	}
	if input.MinutosDiarios != nil {
		current.MinutosDiarios = *input.MinutosDiarios
	}
	if input.CardsDiarios != nil {
		current.CardsDiarios = *input.CardsDiarios
	}

	// Merge config JSONB
	if input.Config != nil {
		if current.Config == nil {
			current.Config = make(map[string]any)
		}
		for k, v := range input.Config {
			current.Config[k] = v
		}
	}

	if err := s.repo.Upsert(ctx, current); err != nil {
		return nil, fmt.Errorf("failed to update settings: %w", err)
	}

	return current, nil
}

// CompleteOnboarding salva os dados de onboarding (línguas + preferências)
func (s *Service) CompleteOnboarding(ctx context.Context, input repository.OnboardingInput) (*repository.UserSettings, error) {
	// 1. Atualizar idiomas na tabela usuarios
	if err := s.repo.UpdateUserLanguages(ctx, input.UserID, input.NativeLang, input.TargetLang); err != nil {
		return nil, fmt.Errorf("failed to update user languages: %w", err)
	}

	// 2. Criar/atualizar preferências
	us := &repository.UserSettings{
		UsuarioID:            input.UserID,
		IdiomaPadraoTraducao: input.NativeLang,
		AutoTraduzir:         false,
		TemaInterface:        "dark",
		NivelProficiencia:    input.Level,
		MinutosDiarios:       input.DailyMinutes,
		CardsDiarios:         input.DailyCards,
		OnboardingCompleto:   true,
		Config:               make(map[string]any),
	}

	if us.NivelProficiencia == "" {
		us.NivelProficiencia = "intermediate"
	}

	if err := s.repo.Upsert(ctx, us); err != nil {
		return nil, fmt.Errorf("failed to save onboarding settings: %w", err)
	}

	return us, nil
}
