package user

import "time"

type User struct {
	ID             int       `json:"id"`
	Nome           string    `json:"nome"`
	Email          string    `json:"email"`
	SenhaHash      string    `json:"-"`
	TokenExtensao  string    `json:"token_extensao,omitempty"`
	CriadoEm       time.Time `json:"criado_em"`
}

type Preferences struct {
	ID                     int    `json:"id"`
	UsuarioID              int    `json:"usuario_id"`
	IdiomaPadraoTraducao   string `json:"idioma_padrao_traducao"`
	AutoTraduzir           bool   `json:"auto_traduzir"`
	TemaInterface          string `json:"tema_interface"`
}

type RefreshToken struct {
	ID        int       `json:"id"`
	UsuarioID int       `json:"usuario_id"`
	Token     string    `json:"token"`
	ExpiraEm  time.Time `json:"expira_em"`
	CriadoEm  time.Time `json:"criado_em"`
	Revogado  bool      `json:"revogado"`
}

type CreateInput struct {
	Nome  string `json:"nome"`
	Email string `json:"email"`
	Senha string `json:"senha"`
}

type UpdateInput struct {
	Nome  string `json:"nome,omitempty"`
	Email string `json:"email,omitempty"`
}

type LoginInput struct {
	Email string `json:"email"`
	Senha string `json:"senha"`
}

type RegisterInput struct {
	Nome  string `json:"nome"`
	Email string `json:"email"`
	Senha string `json:"senha"`
}

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}
