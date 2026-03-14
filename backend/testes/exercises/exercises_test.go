package exercises_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestListExercises_Success(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := env.AuthGet("/api/v1/exercises")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("ListExercises OK — %s", string(body))
}

func TestListExercises_Unauthorized(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/exercises")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestMarkExerciseViewed_Unauthorized(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/exercises/1/view", nil)

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}
