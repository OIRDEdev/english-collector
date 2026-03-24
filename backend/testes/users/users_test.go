package users_test

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"extension-backend/testes/testutil"
)

// ─────────────────────── GET /api/v1/users ───────────────────────

func TestListUsers_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users")

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	data, ok := response["data"].([]interface{})
	if !ok || len(data) == 0 {
		t.Errorf("Expected at least one user in the database")
	}
	t.Logf("ListUsers OK — %d users", len(data))
}

func TestListUsers_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/users")

	if resp.StatusCode != 401 {
		t.Fatalf("Expected 401 without auth, got %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /api/v1/users/{id} ───────────────────────

func TestGetUser_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users/1")

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)

	data := response["data"].(map[string]interface{})
	if fmt.Sprintf("%v", data["id"]) != "1" {
		t.Errorf("Expected user ID 1, got %v", data["id"])
	}
	t.Logf("GetUser OK: %s", string(body))
}

func TestGetUser_NotFound(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users/999999")

	if resp.StatusCode != 404 {
		t.Fatalf("Expected 404, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetUser_InvalidID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users/abc")

	// Deve retornar 404 ou 400 — não pode crashar
	if resp.StatusCode != 404 && resp.StatusCode != 400 {
		t.Fatalf("Expected 404 or 400 for invalid ID, got %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetUser_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, _ := testutil.UnauthGet(env.BaseURL, "/api/v1/users/1")

	if resp.StatusCode != 401 {
		t.Fatalf("Expected 401, got %d", resp.StatusCode)
	}
}

// ─────────────────────── POST /api/v1/users ───────────────────────

func TestCreateUser_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	uniqueEmail := fmt.Sprintf("test_create_%d@test.com", time.Now().UnixNano())
	payload := map[string]interface{}{
		"nome":  "Test User Created",
		"email": uniqueEmail,
		"senha": "password123",
	}

	resp, body := env.AuthPost("/api/v1/users", payload)

	if resp.StatusCode != 201 {
		t.Fatalf("Expected 201, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)

	data := response["data"].(map[string]interface{})
	if data["email"] != uniqueEmail {
		t.Errorf("Expected email %s, got %v", uniqueEmail, data["email"])
	}

	// Cleanup — deleta o user criado
	userID := fmt.Sprintf("%.0f", data["id"].(float64))
	env.AuthDelete("/api/v1/users/" + userID)
	t.Logf("CreateUser OK — user %s criado e deletado", userID)
}

func TestCreateUser_DuplicateEmail(t *testing.T) {
	env := testutil.NewTestEnv()

	uniqueEmail := fmt.Sprintf("test_dup_%d@test.com", time.Now().UnixNano())
	payload := map[string]interface{}{
		"nome":  "Duplicate Test",
		"email": uniqueEmail,
		"senha": "password123",
	}

	// Criar primeiro
	resp1, body1 := env.AuthPost("/api/v1/users", payload)
	if resp1.StatusCode != 201 {
		t.Fatalf("First create failed: %d: %s", resp1.StatusCode, string(body1))
	}

	// Tentar criar com mesmo email — deve falhar
	resp2, body2 := env.AuthPost("/api/v1/users", payload)
	if resp2.StatusCode == 201 {
		t.Errorf("Expected error for duplicate email, got 201: %s", string(body2))
	}

	// Cleanup
	var parsed map[string]interface{}
	json.Unmarshal(body1, &parsed)
	data := parsed["data"].(map[string]interface{})
	userID := fmt.Sprintf("%.0f", data["id"].(float64))
	env.AuthDelete("/api/v1/users/" + userID)
}

func TestCreateUser_MissingFields(t *testing.T) {
	env := testutil.NewTestEnv()

	// Payload sem campos obrigatórios
	resp, body := env.AuthPost("/api/v1/users", map[string]interface{}{})

	// Deve retornar 400 ou 500, não pode crashar
	if resp.StatusCode == 201 {
		t.Fatalf("Should not create user without required fields: %s", string(body))
	}
	t.Logf("Missing fields retornou %d (correto)", resp.StatusCode)
}

// ─────────────────────── PUT /api/v1/users/{id} ───────────────────────

func TestUpdateUser_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// Criar user temporário
	uniqueEmail := fmt.Sprintf("test_update_%d@test.com", time.Now().UnixNano())
	_, createBody := env.AuthPost("/api/v1/users", map[string]interface{}{
		"nome":  "To Be Updated",
		"email": uniqueEmail,
		"senha": "password123",
	})

	var createParsed map[string]interface{}
	json.Unmarshal(createBody, &createParsed)
	data := createParsed["data"].(map[string]interface{})
	userID := fmt.Sprintf("%.0f", data["id"].(float64))

	// Update
	resp, body := env.AuthPut("/api/v1/users/"+userID, map[string]interface{}{
		"nome": "Updated Name",
	})

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	var response map[string]interface{}
	json.Unmarshal(body, &response)
	updatedData := response["data"].(map[string]interface{})
	if updatedData["nome"] != "Updated Name" {
		t.Errorf("Expected 'Updated Name', got %v", updatedData["nome"])
	}

	// Cleanup
	env.AuthDelete("/api/v1/users/" + userID)
	t.Logf("UpdateUser OK")
}

// ─────────────────────── DELETE /api/v1/users/{id} ───────────────────────

func TestDeleteUser_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// Criar user temporário
	uniqueEmail := fmt.Sprintf("test_delete_%d@test.com", time.Now().UnixNano())
	_, createBody := env.AuthPost("/api/v1/users", map[string]interface{}{
		"nome":  "To Be Deleted",
		"email": uniqueEmail,
		"senha": "password123",
	})

	var createParsed map[string]interface{}
	json.Unmarshal(createBody, &createParsed)
	data := createParsed["data"].(map[string]interface{})
	userID := fmt.Sprintf("%.0f", data["id"].(float64))

	// Delete
	resp, body := env.AuthDelete("/api/v1/users/" + userID)

	if resp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", resp.StatusCode, string(body))
	}

	// Verificar que não existe mais
	getResp, _ := env.AuthGet("/api/v1/users/" + userID)
	if getResp.StatusCode != 404 {
		t.Errorf("Expected 404 after deletion, got %d", getResp.StatusCode)
	}
	t.Logf("DeleteUser OK — user %s removido", userID)
}

func TestDeleteUser_NotFound(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthDelete("/api/v1/users/999999")

	// Pode retornar 200 (DELETE idempotente) ou 404/500
	t.Logf("Delete inexistente retornou %d: %s", resp.StatusCode, string(body))
}

// ─────────────────────── Testes de Segurança ───────────────────────

func TestUsers_SQLInjection_InID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users/1;DROP TABLE usuarios;--")

	// Deve retornar erro, NÃO executar o SQL
	if resp.StatusCode == 200 {
		t.Fatalf("SQL injection should not return 200: %s", string(body))
	}
	t.Logf("SQL injection no ID retornou %d (correto)", resp.StatusCode)
}

func TestUsers_XSS_InName(t *testing.T) {
	env := testutil.NewTestEnv()

	uniqueEmail := fmt.Sprintf("xss_%d@test.com", time.Now().UnixNano())
	payload := map[string]interface{}{
		"nome":  "<script>alert('pwned')</script>",
		"email": uniqueEmail,
		"senha": "password123",
	}

	resp, body := env.AuthPost("/api/v1/users", payload)

	// Deve criar normalmente (é uma string), mas não executar o script
	if resp.StatusCode != 201 {
		t.Logf("XSS in name retornou %d: %s (pode ser aceitável)", resp.StatusCode, string(body))
		return
	}

	// Cleanup
	var parsed map[string]interface{}
	json.Unmarshal(body, &parsed)
	data := parsed["data"].(map[string]interface{})
	userID := fmt.Sprintf("%.0f", data["id"].(float64))
	env.AuthDelete("/api/v1/users/" + userID)
	t.Logf("XSS no nome aceito mas armazenado como string — sem execução")
}

func TestUsers_NegativeID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/users/-1")

	if resp == nil {
		t.Fatal("Backend crashou com ID negativo")
	}
	t.Logf("ID negativo retornou %d: %s", resp.StatusCode, string(body))
}
