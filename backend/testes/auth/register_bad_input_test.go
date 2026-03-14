package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestRegister_BadInput(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	tests := []struct {
		name    string
		payload any
		expect  int
	}{
		{"JSON Inválido", "lixo", 400},
		{"Sem Nome", map[string]string{"email": "a@b.com", "senha": "123"}, 201}, // mock aceita
		{"Email Duplicado (já existe test@test.com)", map[string]string{
			"nome": "Dup", "email": "test@test.com", "senha": "123",
		}, 400},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/auth/register", tt.payload)
			if resp.StatusCode != tt.expect {
				t.Errorf("Esperava %d, recebeu %d: %s", tt.expect, resp.StatusCode, string(body))
			}
		})
	}
}
