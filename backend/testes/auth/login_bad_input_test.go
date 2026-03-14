package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestLogin_BadInput(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	tests := []struct {
		name    string
		payload any
		expect  int
	}{
		{"JSON Inválido (string pura)", "not-json-at-all", 400},
		{"Email Vazio", map[string]string{"email": "", "senha": "test123"}, 401},
		{"Senha Errada", map[string]string{"email": "test@test.com", "senha": "wrongpass"}, 401},
		{"Usuário Inexistente", map[string]string{"email": "nobody@test.com", "senha": "test123"}, 401},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/auth/login", tt.payload)
			if resp.StatusCode != tt.expect {
				t.Errorf("Esperava %d, recebeu %d: %s", tt.expect, resp.StatusCode, string(body))
			}
		})
	}
}
