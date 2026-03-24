package anki_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestGetDueCards_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/anki/due?user_id=1")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("GetDueCards OK — %s", string(body))
}

func TestSubmitReview_BadInput(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthPost("/api/v1/anki/review", map[string]any{
		"anki_id": 0,
		"nota":    0,
	})

	if resp.StatusCode == 200 {
		t.Fatalf("Review com input zerado não deveria retornar 200: %s", string(body))
	}
	t.Logf("Review bad input → %d OK", resp.StatusCode)
}

func TestGetDueCards_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/anki/due")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}
