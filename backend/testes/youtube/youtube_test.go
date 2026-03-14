package youtube_test

import (
	"testing"

	"extension-backend/testes/testutil"
)

func TestTranscript_Unauthorized(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/youtube/transcript/dQw4w9WgXcQ")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestTranscript_MissingID(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	// Rota com ID vazio — o router do chi não vai matchear, então 405 ou 404
	resp, _ := env.AuthGet("/api/v1/youtube/transcript/")

	if resp.StatusCode == 200 {
		t.Fatal("Não deveria aceitar transcript com ID vazio")
	}
	t.Logf("Transcript sem ID → %d (expected non-200)", resp.StatusCode)
}
