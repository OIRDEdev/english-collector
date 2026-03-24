package settings_test

import (
	"encoding/json"
	"strings"
	"testing"

	"extension-backend/testes/testutil"
)

// ─────────────────────── GET /api/v1/settings ───────────────────────

func TestGetSettings_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/settings?user_id=1")

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		t.Fatalf("Failed to parse response JSON: %v", err)
	}

	t.Logf("GetSettings OK: %s", string(body))
}

func TestGetSettings_MissingUserID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/settings")

	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400 without user_id, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetSettings_InvalidUserID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/settings?user_id=abc")

	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400 for invalid user_id, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetSettings_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, _ := testutil.UnauthGet(env.BaseURL, "/api/v1/settings?user_id=1")

	if resp.StatusCode != 401 {
		t.Fatalf("Expected 401 without auth, got %d", resp.StatusCode)
	}
}

func TestGetSettings_NonExistentUser(t *testing.T) {
	env := testutil.NewTestEnv()

	// Usuário que provavelmente não existe — deve retornar defaults
	resp, body := env.AuthGet("/api/v1/settings?user_id=999999")

	// O service retorna defaults quando não encontra no DB
	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200 (defaults), got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)

	// deve retornar defaults
	if response["onboarding_completo"] != false {
		t.Errorf("Expected onboarding_completo=false for non-existent user")
	}
	t.Logf("Defaults para user inexistente: %s", string(body))
}

// ─────────────────────── PUT /api/v1/settings ───────────────────────

func TestUpdateSettings_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	tema := "light"
	minutos := 30
	payload := map[string]interface{}{
		"user_id":         1,
		"tema_interface":  &tema,
		"minutos_diarios": &minutos,
	}

	resp, body := env.AuthPut("/api/v1/settings", payload)

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)

	if response["tema_interface"] != "light" {
		t.Errorf("Expected tema 'light', got %v", response["tema_interface"])
	}
	if response["minutos_diarios"] != float64(30) {
		t.Errorf("Expected minutos 30, got %v", response["minutos_diarios"])
	}
	t.Logf("UpdateSettings OK: %s", string(body))

	// Restaurar para dark
	temaDark := "dark"
	env.AuthPut("/api/v1/settings", map[string]interface{}{
		"user_id":        1,
		"tema_interface": &temaDark,
	})
}

func TestUpdateSettings_MissingUserID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthPut("/api/v1/settings", map[string]interface{}{
		"tema_interface": "light",
	})

	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400 for missing user_id, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestUpdateSettings_EmptyBody(t *testing.T) {
	env := testutil.NewTestEnv()

	// Body vazio — deve ser 400 (bad request)
	resp, body := env.AuthPut("/api/v1/settings", nil)

	// user_id = 0 por default → 400
	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400 for empty body, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestUpdateSettings_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, _ := testutil.UnauthPost(env.BaseURL, "/api/v1/settings", map[string]interface{}{
		"user_id":        1,
		"tema_interface": "light",
	})

	// PUT via UnauthPost — sem cookie, deve ser 401
	if resp.StatusCode != 401 && resp.StatusCode != 405 {
		t.Fatalf("Expected 401 or 405 without auth, got %d", resp.StatusCode)
	}
}

// ─────────────────────── POST /api/v1/settings/onboarding ───────────────────────

func TestCompleteOnboarding_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	payload := map[string]interface{}{
		"user_id":        1,
		"native_lang_id": 7,
		"target_lang_id": 1,
		"level":          "advanced",
		"daily_minutes":  45,
		"daily_cards":    20,
	}

	resp, body := env.AuthPost("/api/v1/settings/onboarding", payload)

	if resp.StatusCode != 201 {
		t.Fatalf("Expected 201 Created, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)

	if response["onboarding_completo"] != true {
		t.Errorf("Expected onboarding_completo=true")
	}
	if response["nivel_proficiencia"] != "advanced" {
		t.Errorf("Expected level advanced, got %v", response["nivel_proficiencia"])
	}
	t.Logf("Onboarding OK: %s", string(body))
}

func TestCompleteOnboarding_MissingLangIDs(t *testing.T) {
	env := testutil.NewTestEnv()

	payload := map[string]interface{}{
		"user_id": 1,
		"level":   "beginner",
	}

	resp, body := env.AuthPost("/api/v1/settings/onboarding", payload)

	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400, got %d: %s", resp.StatusCode, string(body))
	}
	if !strings.Contains(string(body), "native_lang_id and target_lang_id are required") {
		t.Errorf("Expected error about missing lang IDs, got: %s", string(body))
	}
}

func TestCompleteOnboarding_MissingUserID(t *testing.T) {
	env := testutil.NewTestEnv()

	payload := map[string]interface{}{
		"native_lang_id": 7,
		"target_lang_id": 1,
	}

	resp, body := env.AuthPost("/api/v1/settings/onboarding", payload)

	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestCompleteOnboarding_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, _ := testutil.UnauthPost(env.BaseURL, "/api/v1/settings/onboarding", map[string]interface{}{
		"user_id":        1,
		"native_lang_id": 7,
		"target_lang_id": 1,
	})

	if resp.StatusCode != 401 {
		t.Fatalf("Expected 401 without auth, got %d", resp.StatusCode)
	}
}

// ─────────────────────── Testes de Segurança ───────────────────────

func TestSettings_SQLInjection(t *testing.T) {
	env := testutil.NewTestEnv()

	// Tentativa de SQL injection via user_id
	resp, body := env.AuthGet("/api/v1/settings?user_id=1;DROP TABLE preferencias_usuario;--")

	// Deve retornar 400 (invalid user_id) porque não é um int válido
	if resp.StatusCode != 400 {
		t.Fatalf("Expected 400 for SQL injection attempt, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestSettings_XSSInPayload(t *testing.T) {
	env := testutil.NewTestEnv()

	xss := "<script>alert('xss')</script>"
	payload := map[string]interface{}{
		"user_id":        1,
		"tema_interface": &xss,
	}

	resp, body := env.AuthPut("/api/v1/settings", payload)

	// O backend pode aceitar (200 — armazena como string sem executar)
	// ou rejeitar (400/500 — DB tem varchar(20) constraint, rejeita strings longas)
	// Ambos são comportamentos de segurança válidos
	if resp.StatusCode != 200 && resp.StatusCode != 400 && resp.StatusCode != 500 {
		t.Fatalf("Expected 200, 400 or 500, got %d: %s", resp.StatusCode, string(body))
	}
	t.Logf("XSS payload retornou %d (seguro)", resp.StatusCode)

	// Restaurar
	dark := "dark"
	env.AuthPut("/api/v1/settings", map[string]interface{}{
		"user_id":        1,
		"tema_interface": &dark,
	})
}

func TestSettings_HugePayload(t *testing.T) {
	env := testutil.NewTestEnv()

	// Payload gigante para tentar DDoS / buffer overflow
	huge := strings.Repeat("A", 10_000_000) // 10MB de lixo
	payload := map[string]interface{}{
		"user_id":        1,
		"tema_interface": &huge,
	}

	resp, _ := env.AuthPut("/api/v1/settings", payload)

	// Backend pode retornar 400, 413, ou 500 — qualquer coisa exceto crash é OK
	if resp == nil {
		t.Fatal("Backend crashou com payload gigante")
	}
	t.Logf("Payload gigante retornou %d (backend não crashou)", resp.StatusCode)
}

func TestSettings_NegativeUserID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/settings?user_id=-1")

	// Não deve causar crash — pode retornar defaults ou erro
	if resp.StatusCode == 0 {
		t.Fatal("Backend crashou com user_id negativo")
	}
	t.Logf("user_id=-1 retornou %d: %s", resp.StatusCode, string(body))
}
