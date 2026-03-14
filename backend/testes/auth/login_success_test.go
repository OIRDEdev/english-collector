package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestLogin_Success(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/auth/login", map[string]string{
		"email": "test@test.com",
		"senha": "test123",
	})

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}

	// Deve setar cookie access_token
	var foundCookie bool
	for _, c := range resp.Cookies() {
		if c.Name == "access_token" && c.Value != "" {
			foundCookie = true
		}
	}
	if !foundCookie {
		t.Fatal("Cookie access_token não encontrado na resposta de login")
	}

	t.Logf("Login OK — body: %s", string(body))
}
