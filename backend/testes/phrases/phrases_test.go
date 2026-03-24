package phrases_test

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"extension-backend/testes/testutil"
)

func TestCreatePhrase_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Hello World Integration",
		"idioma_origem": "en",
		"titulo_pagina": "Test Page",
		"url_origem":    "https://test.com",
		"contexto":      "Test context",
	})

	if resp.StatusCode != 201 {
		t.Fatalf("Esperava 201, recebeu %d: %s", resp.StatusCode, string(body))
	}

	var parsedResp map[string]interface{}
	json.Unmarshal(body, &parsedResp)

	data := parsedResp["data"].(map[string]interface{})
	if data["id"] == nil || data["id"].(float64) == 0 {
		t.Fatalf("Expected non-zero ID")
	}

	// Cleanup via DELETE
	phraseID := fmt.Sprintf("%.0f", data["id"].(float64))
	env.AuthDelete("/api/v1/phrases/" + phraseID)

	t.Logf("CreatePhrase OK — ID: %s", phraseID)
}

func TestCreatePhrase_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthPost(env.BaseURL, "/api/v1/phrases", map[string]any{
		"conteudo": "test",
	})

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestCreatePhrase_XSS(t *testing.T) {
	env := testutil.NewTestEnv()

	xss := `<script>alert('xss')</script>`
	resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      xss,
		"idioma_origem": "en",
	})

	if resp.StatusCode == 201 {
		var parsed map[string]interface{}
		json.Unmarshal(body, &parsed)
		data := parsed["data"].(map[string]interface{})
		phraseID := fmt.Sprintf("%.0f", data["id"].(float64))
		env.AuthDelete("/api/v1/phrases/" + phraseID)
	}
	t.Logf("XSS test retornou %d", resp.StatusCode)
}

func TestGetPhrase_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// 1. Create
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Fetching this phrase",
		"idioma_origem": "en",
	})

	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase: %d: %s", createResp.StatusCode, string(createBody))
	}

	var parsed map[string]interface{}
	json.Unmarshal(createBody, &parsed)
	data := parsed["data"].(map[string]interface{})
	phraseID := fmt.Sprintf("%.0f", data["id"].(float64))

	defer env.AuthDelete("/api/v1/phrases/" + phraseID)

	// 2. Fetch
	getResp, getBody := env.AuthGet("/api/v1/phrases/" + phraseID)

	if getResp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", getResp.StatusCode, string(getBody))
	}

	if !strings.Contains(string(getBody), "Fetching this phrase") {
		t.Errorf("Phrase content not found in response")
	}
}

func TestListPhrases_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// Create multiple phrases
	var createdIDs []string
	for i := 0; i < 3; i++ {
		resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
			"usuario_id":    1,
			"conteudo":      fmt.Sprintf("List phrase %d %d", i, time.Now().UnixNano()),
			"idioma_origem": "en",
		})
		if resp.StatusCode == 201 {
			var parsed map[string]interface{}
			json.Unmarshal(body, &parsed)
			data := parsed["data"].(map[string]interface{})
			createdIDs = append(createdIDs, fmt.Sprintf("%.0f", data["id"].(float64)))
		}
	}

	defer func() {
		for _, id := range createdIDs {
			env.AuthDelete("/api/v1/phrases/" + id)
		}
	}()

	listResp, listBody := env.AuthGet("/api/v1/phrases?limit=10")
	if listResp.StatusCode != 200 {
		t.Fatalf("Expected 200, got %d: %s", listResp.StatusCode, string(listBody))
	}

	t.Logf("ListPhrases OK — %d bytes", len(listBody))
}

func TestUpdatePhrase_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// 1. Create
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Original content",
		"idioma_origem": "en",
	})
	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase")
	}

	var parsed map[string]interface{}
	json.Unmarshal(createBody, &parsed)
	data := parsed["data"].(map[string]interface{})
	phraseID := fmt.Sprintf("%.0f", data["id"].(float64))

	defer env.AuthDelete("/api/v1/phrases/" + phraseID)

	// 2. Update via PUT
	putResp, putBody := env.AuthPut("/api/v1/phrases/"+phraseID, map[string]any{
		"conteudo": "Updated content",
		"contexto": "Some context added",
	})

	if putResp.StatusCode != 200 {
		t.Fatalf("Expected 200 on PUT, got %d: %s", putResp.StatusCode, string(putBody))
	}

	// 3. Verify
	getResp, getBody := env.AuthGet("/api/v1/phrases/" + phraseID)
	if getResp.StatusCode != 200 {
		t.Fatalf("Failed to fetch after update: %d", getResp.StatusCode)
	}

	if !strings.Contains(string(getBody), "Updated content") {
		t.Errorf("Update did not persist. Response: %s", string(getBody))
	}
}

func TestDeletePhrase_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// 1. Create
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "To be deleted",
		"idioma_origem": "en",
	})
	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase")
	}

	var parsed map[string]interface{}
	json.Unmarshal(createBody, &parsed)
	data := parsed["data"].(map[string]interface{})
	phraseID := fmt.Sprintf("%.0f", data["id"].(float64))

	// 2. Delete
	deleteResp, deleteBody := env.AuthDelete("/api/v1/phrases/" + phraseID)
	if deleteResp.StatusCode != 200 {
		t.Fatalf("Expected 200 on DELETE, got %d: %s", deleteResp.StatusCode, string(deleteBody))
	}

	// 3. Verify
	getResp, _ := env.AuthGet("/api/v1/phrases/" + phraseID)
	if getResp.StatusCode != 404 {
		t.Errorf("Expected 404 for deleted phrase, got %d", getResp.StatusCode)
	}
}
