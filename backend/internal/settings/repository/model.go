package repository

// UserSettings representa as preferências completas do usuário (tabela preferencias_usuario)
type UserSettings struct {
	ID                   int            `json:"id"`
	UsuarioID            int            `json:"usuario_id"`
	IdiomaPadraoTraducao string         `json:"idioma_padrao_traducao"`
	AutoTraduzir         bool           `json:"auto_traduzir"`
	TemaInterface        string         `json:"tema_interface"`
	NivelProficiencia    string         `json:"nivel_proficiencia"`
	MinutosDiarios       int            `json:"minutos_diarios"`
	CardsDiarios         int            `json:"cards_diarios"`
	OnboardingCompleto   bool           `json:"onboarding_completo"`
	Config               map[string]any `json:"config"`
}

// UpdateSettingsInput payload enviado pelo SettingsModal
type UpdateSettingsInput struct {
	UserID               int            `json:"user_id"`
	IdiomaPadraoTraducao *string        `json:"idioma_padrao_traducao,omitempty"`
	AutoTraduzir         *bool          `json:"auto_traduzir,omitempty"`
	TemaInterface        *string        `json:"tema_interface,omitempty"`
	NivelProficiencia    *string        `json:"nivel_proficiencia,omitempty"`
	MinutosDiarios       *int           `json:"minutos_diarios,omitempty"`
	CardsDiarios         *int           `json:"cards_diarios,omitempty"`
	Config               map[string]any `json:"config,omitempty"`
}

// OnboardingInput payload enviado pelo Onboarding.tsx
type OnboardingInput struct {
	UserID       int    `json:"user_id"`
	NativeLang   string `json:"native_lang"`
	TargetLang   string `json:"target_lang"`
	DailyMinutes int    `json:"daily_minutes"`
	DailyCards   int    `json:"daily_cards"`
	Plan         string `json:"plan"`
	Level        string `json:"level,omitempty"`
}
