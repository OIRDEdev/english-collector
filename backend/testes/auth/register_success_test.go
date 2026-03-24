package auth_test

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"extension-backend/testes/testutil"
)

func TestRegister_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	uniqueEmail := fmt.Sprintf("register_test_%d@test.com", time.Now().UnixNano())

	resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/auth/register", map[string]string{
		"nome":  "Novo Usuário Teste",
		"email": uniqueEmail,
		"senha": "senhasegura123",
	})

	if resp.StatusCode != 201 {
		t.Fatalf("Esperava 201 Created, recebeu %d: %s", resp.StatusCode, string(body))
	}

	// Deve setar cookies
	var foundCookie bool
	for _, c := range resp.Cookies() {
		if c.Name == "access_token" && c.Value != "" {
			foundCookie = true
		}
	}
	if !foundCookie {
		t.Fatal("Cookie access_token não encontrado após register")
	}

	// Cleanup — deletar user via API
	var parsed map[string]interface{}
	json.Unmarshal(body, &parsed)
	if id, ok := parsed["id"]; ok {
		userID := fmt.Sprintf("%.0f", id.(float64))
		env.AuthDelete("/api/v1/users/" + userID)
	}

	t.Logf("Register OK — body: %s", string(body))
}
