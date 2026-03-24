package auth_test

import (
	"strings"
	"testing"

	"extension-backend/testes/testutil"
)

func TestLogin_XSS(t *testing.T) {
	env := testutil.NewTestEnv()

	xssPayloads := []string{
		`<script>alert('xss')</script>`,
		`"><img src=x onerror=alert(1)>`,
		`' OR 1=1 --`,
		`javascript:alert(document.cookie)`,
	}

	for _, xss := range xssPayloads {
		t.Run("XSS_email_"+xss[:10], func(t *testing.T) {
			resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/auth/login", map[string]string{
				"email": xss,
				"senha": env.TestSenha,
			})

			if resp.StatusCode == 200 {
				t.Fatalf("Login com XSS payload não deveria retornar 200")
			}

			if strings.Contains(string(body), "<script>") {
				t.Errorf("VULNERABILIDADE XSS: resposta refletiu <script> tag:\n%s", string(body))
			}
			if strings.Contains(string(body), "onerror=") {
				t.Errorf("VULNERABILIDADE XSS: resposta refletiu event handler:\n%s", string(body))
			}
		})

		t.Run("XSS_senha_"+xss[:10], func(t *testing.T) {
			resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/auth/login", map[string]string{
				"email": env.TestEmail,
				"senha": xss,
			})

			if resp.StatusCode == 200 {
				t.Fatalf("Login com XSS na senha não deveria retornar 200")
			}

			if strings.Contains(string(body), "<script>") {
				t.Errorf("VULNERABILIDADE XSS: resposta refletiu <script> tag:\n%s", string(body))
			}
		})
	}
}
