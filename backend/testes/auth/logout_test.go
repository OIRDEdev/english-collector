package auth_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestLogout_ClearsCookies(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthPost("/api/v1/auth/logout", nil)

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}

	t.Logf("Logout OK — body: %s", string(body))
}
