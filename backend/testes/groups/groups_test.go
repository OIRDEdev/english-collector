package groups_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestCreateGroup_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthPost("/api/v1/groups", map[string]any{
		"usuario_id": 1,
		"nome_grupo": "Meus Favoritos",
	})

	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		t.Fatalf("Esperava 200/201, recebeu %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("CreateGroup OK — %s", string(body))
}

func TestCreateGroup_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/groups", map[string]any{
		"nome_grupo": "Hacker Group",
	})

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}
