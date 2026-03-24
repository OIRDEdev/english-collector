package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestRegister_BadInput(t *testing.T) {
	env := testutil.NewTestEnv()

	tests := []struct {
		name    string
		payload any
		expect  int
	}{
		{"JSON Inválido", "lixo", 400},
		{"Email Duplicado (já existe test_runner)", map[string]string{
			"nome": "Dup", "email": env.TestEmail, "senha": "123",
		}, 400},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/auth/register", tt.payload)
			if resp.StatusCode != tt.expect {
				t.Errorf("Esperava %d, recebeu %d: %s", tt.expect, resp.StatusCode, string(body))
			}
		})
	}
}
