package phrases_test

import (
	"strings"
	"testing"

	"extension-backend/testes/testutil"
)

func TestCreatePhrase_Success(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Hello World",
		"idioma_origem": "en",
	})

	if resp.StatusCode != 201 && resp.StatusCode != 200 {
		t.Fatalf("Esperava 200/201, recebeu %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("CreatePhrase OK — %s", string(body))
}

func TestCreatePhrase_Unauthorized(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/phrases", map[string]any{
		"conteudo": "test",
	})

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestCreatePhrase_XSS(t *testing.T) {
	env := testutil.StartTestServer()
	defer env.Server.Close()

	xss := `<script>alert('xss')</script>`
	resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      xss,
		"idioma_origem": "en",
	})

	// O conteúdo pode ser salvo (é texto do usuário), mas o response NÃO deve refletir <script> sem escape
	if resp.StatusCode == 200 || resp.StatusCode == 201 {
		if strings.Contains(string(body), "<script>") {
			t.Errorf("VULNERABILIDADE XSS: resposta refletiu <script> tag sem escape:\n%s", string(body))
		}
	}
	t.Logf("XSS test done — status %d", resp.StatusCode)
}
