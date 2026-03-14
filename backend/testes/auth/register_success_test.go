package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestRegister_Success(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/auth/register", map[string]string{
		"nome":  "Novo Usuário",
		"email": "novo@test.com",
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

	t.Logf("Register OK — body: %s", string(body))
}
