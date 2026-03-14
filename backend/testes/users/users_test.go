package users_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestListUsers_Success(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := env.AuthGet("/api/v1/users")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("ListUsers OK — %s", string(body))
}

func TestListUsers_Unauthorized(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/users")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}
