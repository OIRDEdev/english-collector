package testutil

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/joho/godotenv"
)

// ─────────────────────── Test Environment ───────────────────────
// Sem mocks. Os testes fazem chamadas HTTP reais ao backend rodando.
// O backend DEVE estar rodando antes de executar os testes.

type TestEnv struct {
	BaseURL   string // ex: http://localhost:8080
	TestEmail string // email do usuário de teste
	TestSenha string // senha do usuário de teste
	TestUserID int   // ID do usuário de teste
}

// Credenciais fixas do usuário de teste
const (
	testEmail = "edrio@gmail.com"
	testSenha = "123456"
	testNome  = "Edrio"
)

// loadEnv carrega o .env do backend para ler variáveis de ambiente.
func loadEnv() {
	_, filename, _, _ := runtime.Caller(0)
	envPath := filepath.Join(filepath.Dir(filename), "..", "..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: could not load .env from %s: %v", envPath, err)
	}
}

// NewTestEnv cria o ambiente de teste apontando para o backend real.
// Usa TEST_BASE_URL se definida, senão usa http://localhost:PORT.
// Garante que o usuário de teste existe no banco (registra se necessário).
func NewTestEnv() *TestEnv {
	loadEnv()
	baseURL := os.Getenv("TEST_BASE_URL")
	if baseURL == "" {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		baseURL = fmt.Sprintf("http://localhost:%s", port)
	}

	// Verificar se o backend está rodando
	resp, err := http.Get(baseURL + "/health")
	if err != nil {
		log.Fatalf("Backend não está rodando em %s — inicie com 'make run-back' antes dos testes: %v", baseURL, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		log.Fatalf("Backend health check falhou com status %d", resp.StatusCode)
	}
	log.Printf("[test] Backend ativo em %s", baseURL)

	env := &TestEnv{
		BaseURL:   baseURL,
		TestEmail: testEmail,
		TestSenha: testSenha,
	}

	// Tentar login para ver se o usuário de teste já existe
	cookie := env.tryLogin(testEmail, testSenha)
	if cookie == nil {
		// Usuário não existe — registrar
		log.Println("[test] Registrando usuário de teste...")
		body, _ := json.Marshal(map[string]string{
			"nome":  testNome,
			"email": testEmail,
			"senha": testSenha,
		})
		regResp, err := http.Post(baseURL+"/api/v1/auth/register", "application/json", bytes.NewReader(body))
		if err != nil {
			log.Fatalf("Falha ao registrar usuário de teste: %v", err)
		}
		defer regResp.Body.Close()
		regBody, _ := io.ReadAll(regResp.Body)

		if regResp.StatusCode != 201 {
			log.Fatalf("Falha ao registrar usuário de teste (status %d): %s", regResp.StatusCode, string(regBody))
		}
		log.Println("[test] Usuário de teste registrado com sucesso")
	}

	return env
}

// ─────────────────────── Helper: Login ───────────────────────

// tryLogin tenta fazer login e retorna o cookie ou nil se falhar.
func (env *TestEnv) tryLogin(email, senha string) *http.Cookie {
	body, _ := json.Marshal(map[string]string{
		"email": email,
		"senha": senha,
	})
	resp, err := http.Post(env.BaseURL+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil
	}

	for _, c := range resp.Cookies() {
		if c.Name == "access_token" {
			return c
		}
	}
	return nil
}

// LoginAndGetCookie faz login real no backend e retorna o cookie access_token.
func (env *TestEnv) LoginAndGetCookie() *http.Cookie {
	return env.LoginAsUser(env.TestEmail, env.TestSenha)
}

// LoginAsUser faz login com email/senha específicos e retorna o cookie.
func (env *TestEnv) LoginAsUser(email, senha string) *http.Cookie {
	cookie := env.tryLogin(email, senha)
	if cookie == nil {
		panic(fmt.Sprintf("failed to login as %s — user may not exist in DB", email))
	}
	return cookie
}

// ─────────────────────── Helper: HTTP Methods ───────────────────────

// AuthGet faz GET autenticado ao backend real.
func (env *TestEnv) AuthGet(path string) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	req, _ := http.NewRequest("GET", env.BaseURL+path, nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// AuthGetAsUser faz GET autenticado como um usuário específico.
func (env *TestEnv) AuthGetAsUser(path, email, senha string) (*http.Response, []byte) {
	cookie := env.LoginAsUser(email, senha)
	req, _ := http.NewRequest("GET", env.BaseURL+path, nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// AuthPost faz POST autenticado ao backend real.
func (env *TestEnv) AuthPost(path string, payload any) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", env.BaseURL+path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// AuthPut faz PUT autenticado ao backend real.
func (env *TestEnv) AuthPut(path string, payload any) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("PUT", env.BaseURL+path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// AuthDelete faz DELETE autenticado ao backend real.
func (env *TestEnv) AuthDelete(path string) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	req, _ := http.NewRequest("DELETE", env.BaseURL+path, nil)
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// AuthPostAsUser faz POST autenticado como um usuário específico.
func (env *TestEnv) AuthPostAsUser(path, email, senha string, payload any) (*http.Response, []byte) {
	cookie := env.LoginAsUser(email, senha)
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", env.BaseURL+path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		req.AddCookie(cookie)
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// ─────────────────────── Unauthenticated Helpers ───────────────────────

// UnauthGet faz GET sem autenticação.
func UnauthGet(baseURL, path string) (*http.Response, []byte) {
	resp, err := http.Get(baseURL + path)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// UnauthPost faz POST sem autenticação.
func UnauthPost(baseURL, path string, payload any) (*http.Response, []byte) {
	body, _ := json.Marshal(payload)
	resp, err := http.Post(baseURL+path, "application/json", bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}
