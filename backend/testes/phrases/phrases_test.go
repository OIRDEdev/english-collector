package phrases_test

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"extension-backend/internal/phrase"
	"extension-backend/testes/testutil"
)

func TestCreatePhrase_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

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

	var parsedResp struct {
		Success bool          `json:"success"`
		Message string        `json:"message"`
		Data    phrase.Phrase `json:"data"`
	}

	if err := json.Unmarshal(body, &parsedResp); err != nil {
		t.Fatalf("Failed to parse response body: %v", err)
	}

	createdPhrase := parsedResp.Data
	if createdPhrase.ID == 0 {
		t.Fatalf("Expected non-zero ID in returned phrase")
	}
	if createdPhrase.Conteudo != "Hello World Integration" {
		t.Errorf("Expected conteudo 'Hello World Integration', got '%s'", createdPhrase.Conteudo)
	}

	// Clean up real DB
	deletePhraseFromDB(t, env, createdPhrase.ID)
}

func TestCreatePhrase_Unauthorized(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	resp, body := testutil.UnauthPost(env.Server.URL, "/api/v1/phrases", map[string]any{
		"conteudo": "test",
	})

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401 sem auth, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestCreatePhrase_XSS(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	xss := `<script>alert('xss')</script>`
	resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      xss,
		"idioma_origem": "en",
	})

	if resp.StatusCode == 201 {
		var parsedResp struct {
			Data phrase.Phrase `json:"data"`
		}
		json.Unmarshal(body, &parsedResp)
		deletePhraseFromDB(t, env, parsedResp.Data.ID)
	}
}

func TestGetPhrase_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	// 1. Create a phrase
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Fetching this phrase",
		"idioma_origem": "en",
	})

	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase for Get test: %d: %s", createResp.StatusCode, string(createBody))
	}

	var parsedCreate struct {
		Data phrase.Phrase `json:"data"`
	}
	json.Unmarshal(createBody, &parsedCreate)
	phraseID := parsedCreate.Data.ID

	// Defer cleanup
	defer deletePhraseFromDB(t, env, phraseID)

	// 2. Fetch the phrase via GET
	url := fmt.Sprintf("/api/v1/phrases/%d", phraseID)
	getResp, getBody := env.AuthGet(url)

	if getResp.StatusCode != 200 {
		t.Fatalf("Esperava 200 no GET, recebeu %d: %s", getResp.StatusCode, string(getBody))
	}

	var parsedGet struct {
		Success bool          `json:"success"`
		Data    phrase.Phrase `json:"data"`
	}
	if err := json.Unmarshal(getBody, &parsedGet); err != nil {
		t.Fatalf("Failed to parse GET response body: %v", err)
	}

	if parsedGet.Data.ID != phraseID || parsedGet.Data.Conteudo != "Fetching this phrase" {
		t.Errorf("Mismatch. Expected ID=%d Conteudo='Fetching this phrase', got ID=%d Conteudo='%s'", phraseID, parsedGet.Data.ID, parsedGet.Data.Conteudo)
	}
}

func TestListPhrases_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	// 1. Create multiple phrases
	var createdIDs []int
	for i := 0; i < 3; i++ {
		resp, body := env.AuthPost("/api/v1/phrases", map[string]any{
			"usuario_id":    1,
			"conteudo":      fmt.Sprintf("List phrase %d", i),
			"idioma_origem": "en",
		})
		if resp.StatusCode == 201 {
			var parsed struct {
				Data phrase.Phrase `json:"data"`
			}
			json.Unmarshal(body, &parsed)
			createdIDs = append(createdIDs, parsed.Data.ID)
		} else {
			t.Fatalf("Failed to create phrase %d: %s", i, string(body))
		}
	}

	// Defer cleanup for all created phrases
	defer func() {
		for _, id := range createdIDs {
			deletePhraseFromDB(t, env, id)
		}
	}()

	// 2. Fetch the list
	listResp, listBody := env.AuthGet("/api/v1/phrases?limit=10")
	if listResp.StatusCode != 200 {
		t.Fatalf("Expected 200 for List, got %d: %s", listResp.StatusCode, string(listBody))
	}

	// Check pure envelope or not
	// Let's unmarshal into generic map to see structure
	var genericResponse map[string]interface{}
	if err := json.Unmarshal(listBody, &genericResponse); err != nil {
		t.Fatalf("Failed to parse list body: %v", err)
	}

	// Because we use SendJSON (which doesn't wrap in `{"data": ...}` like SendSuccess usually, wait, SendJSON signature sends it as is - we will see).
	// For safety, let's verify if 'data' array is present in the root or wrapped in another `data` key.
	
	// Either way, we should find at least 3 items with our prefix since we just created them.
	bodyStr := string(listBody)
	found := 0
	for i := 0; i < 3; i++ {
		phraseText := fmt.Sprintf("List phrase %d", i)
		if strings.Contains(bodyStr, phraseText) {
			found++
		}
	}

	if found < 3 {
		t.Errorf("Expected to find all 3 created phrases in list response, found %d. Response: %s", found, bodyStr)
	}
}

func TestUpdatePhrase_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	// 1. Create a phrase
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "Original content",
		"idioma_origem": "en",
	})
	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase for Update test")
	}

	var parsedCreate struct {
		Data phrase.Phrase `json:"data"`
	}
	json.Unmarshal(createBody, &parsedCreate)
	phraseID := parsedCreate.Data.ID

	// Defer cleanup
	defer deletePhraseFromDB(t, env, phraseID)

	// 2. Update it via PUT
	url := fmt.Sprintf("/api/v1/phrases/%d", phraseID)
	
	// Need to use Auth method for PUT -> We don't have AuthPut in testutil.
	// So we manually build a PUT request
	cookie := env.LoginAndGetCookie()
	putPayload, _ := json.Marshal(map[string]any{
		"conteudo": "Updated content",
		"contexto": "Some context added",
	})

	req, _ := http.NewRequest("PUT", env.Server.URL+url, strings.NewReader(string(putPayload)))
	req.Header.Set("Content-Type", "application/json")
	req.AddCookie(cookie)

	client := &http.Client{}
	putResp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to do PUT request: %v", err)
	}
	defer putResp.Body.Close()

	if putResp.StatusCode != 200 {
		t.Fatalf("Expected 200 on PUT, got %d", putResp.StatusCode)
	}

	// 3. Verify changes were persisted
	getResp, getBody := env.AuthGet(url)
	if getResp.StatusCode != 200 {
		t.Fatalf("Failed to fetch after update: %d", getResp.StatusCode)
	}

	if !strings.Contains(string(getBody), "Updated content") {
		t.Errorf("Update did not persist. Response: %s", string(getBody))
	}
}

func TestDeletePhrase_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealPhrases()
	defer env.Server.Close()
	defer env.CloseDB()

	// 1. Create phrase
	createResp, createBody := env.AuthPost("/api/v1/phrases", map[string]any{
		"usuario_id":    1,
		"conteudo":      "To be deleted",
		"idioma_origem": "en",
	})
	if createResp.StatusCode != 201 {
		t.Fatalf("Failed to create phrase for Delete test")
	}

	var parsedCreate struct {
		Data phrase.Phrase `json:"data"`
	}
	json.Unmarshal(createBody, &parsedCreate)
	phraseID := parsedCreate.Data.ID

	// Backup deletion ensures we don't leak db entries if tests fail early
	defer deletePhraseFromDB(t, env, phraseID)

	// 2. Use DELETE route
	url := fmt.Sprintf("/api/v1/phrases/%d", phraseID)
	
	cookie := env.LoginAndGetCookie()
	req, _ := http.NewRequest("DELETE", env.Server.URL+url, nil)
	req.AddCookie(cookie)

	client := &http.Client{}
	deleteResp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to do DELETE request: %v", err)
	}
	defer deleteResp.Body.Close()

	if deleteResp.StatusCode != 200 {
		t.Fatalf("Expected 200 on DELETE, got %d", deleteResp.StatusCode)
	}

	// 3. Verify it is actually deleted
	getResp, _ := env.AuthGet(url)
	if getResp.StatusCode != 404 {
		t.Errorf("Expected 404 for deleted phrase, got %d", getResp.StatusCode)
	}
}

// ─────────────────────── Test Database Helpers ───────────────────────

func deletePhraseFromDB(t *testing.T, env *testutil.TestEnv, id int) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := env.RealDB.Exec(ctx, "DELETE FROM frases WHERE id = $1", id)
	if err != nil {
		t.Logf("Warning: failed to delete phrase %d from DB: %v", id, err)
	}
}
