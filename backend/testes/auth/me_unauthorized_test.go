package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestMe_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/auth/me")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem cookie, recebeu %d: %s", resp.StatusCode, string(body))
	}

	t.Logf("Me sem auth → 401 OK")
}

func TestMe_Authorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/auth/me")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200 com cookie, recebeu %d: %s", resp.StatusCode, string(body))
	}

	t.Logf("Me autenticado → 200 OK: %s", string(body))
}
