package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestLogin_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/auth/login", map[string]string{
		"email": env.TestEmail,
		"senha": env.TestSenha,
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
