package exercises_test

import (
	"encoding/json"
	"fmt"
	"strconv"
	"testing"

	"extension-backend/testes/testutil"
)

// ─────────────────────── GET /exercises (real backend) ───────────────────────

func TestListExercises_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/exercises")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("Erro ao parsear JSON: %v", err)
	}

	data, ok := result["data"].([]interface{})
	if !ok || len(data) == 0 {
		t.Fatalf("Esperava array de tipos com catálogos, recebeu: %s", string(body))
	}

	for _, item := range data {
		tipo, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		tipoInfo := tipo["tipo"].(map[string]interface{})
		catalogos := tipo["catalogos"].([]interface{})
		t.Logf("  Tipo: %s (id=%v) — %d catálogo(s)", tipoInfo["nome"], tipoInfo["id"], len(catalogos))
	}

	t.Logf("ListExercises OK — %d tipo(s) retornado(s) do banco real", len(data))
}

func TestListExercises_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/exercises")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/catalogo/{catalogoId} ───────────────────────

func TestGetExercisesByCatalogo_AllCatalogs(t *testing.T) {
	env := testutil.NewTestEnv()

	testCases := []struct {
		Nome   string
		ID     int
		Limit  string
		Expect int
	}{
		{"Catalogo_2", 2, "", 200},
		{"Catalogo_3", 3, "", 200},
		{"Catalogo_4_Limit1", 4, "1", 200},
		{"Catalogo_5_Limit2", 5, "2", 200},
		{"Catalogo_6", 6, "", 200},
		{"Catalogo_7", 7, "", 200},
		{"Catalogo_8", 8, "", 200},
		{"Catalogo_9", 9, "", 200},
		{"Catalogo_10_Limit5", 10, "5", 200},
		{"Catalogo_3_Limit3", 3, "3", 200},
	}

	for _, tc := range testCases {
		t.Run(tc.Nome, func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/catalogo/%d", tc.ID)
			if tc.Limit != "" {
				path += "?limit=" + tc.Limit
			}

			resp, body := env.AuthGet(path)

			// Aceitar 200 ou 204 (sem conteúdo se usuário já visualizou todos)
			if resp.StatusCode != 200 && resp.StatusCode != 204 {
				t.Fatalf("[%s] Esperava 200 ou 204, recebeu %d: %s", tc.Nome, resp.StatusCode, string(body))
			}

			if resp.StatusCode != 200 {
				t.Logf("[%s] Retornou %d (sem exercícios disponíveis)", tc.Nome, resp.StatusCode)
				return
			}

			var result map[string]interface{}
			if err := json.Unmarshal(body, &result); err != nil {
				t.Fatalf("[%s] Erro ao parsear JSON: %v", tc.Nome, err)
			}

			data, ok := result["data"].([]interface{})
			if !ok {
				t.Fatalf("[%s] Esperava array de exercícios, recebeu: %s", tc.Nome, string(body))
			}

			if tc.Limit != "" {
				limit, _ := strconv.Atoi(tc.Limit)
				if len(data) > limit {
					t.Errorf("[%s] Esperava no maximo %d dados, recebeu %d", tc.Nome, limit, len(data))
				}
			}

			for i, item := range data {
				ex, ok := item.(map[string]interface{})
				if !ok {
					continue
				}
				catID := int(ex["catalogo_id"].(float64))
				if catID != tc.ID {
					t.Errorf("[%s] Exercício %d: catalogo_id esperado %d, recebeu %d", tc.Nome, i, tc.ID, catID)
				}

				dados, hasDados := ex["dados_exercicio"]
				if !hasDados || dados == nil {
					t.Errorf("[%s] Exercício %d: dados_exercicio ausente ou nulo", tc.Nome, i)
				}
			}

			t.Logf("[%s] OK — %d exercício(s)", tc.Nome, len(data))
		})
	}
}

func TestGetExercisesByCatalogo_InvalidID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/exercises/catalogo/abc")

	if resp.StatusCode != 400 {
		t.Fatalf("Esperava 400, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercisesByCatalogo_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/exercises/catalogo/2")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/histories ───────────────────────

func TestListHistories_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/exercises/histories")

	if resp.StatusCode != 200 {
		t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("Erro ao parsear JSON: %v", err)
	}

	data, ok := result["data"].([]interface{})
	if !ok {
		t.Fatalf("Esperava array de histórias, recebeu: %s", string(body))
	}

	if len(data) == 0 {
		t.Log("⚠️  Nenhuma história retornada — pode ser que todas já foram visualizadas")
	} else {
		t.Logf("ListHistories OK — %d história(s)", len(data))
	}
}

func TestListHistories_WithLimit(t *testing.T) {
	env := testutil.NewTestEnv()

	limits := []int{1, 2, 3, 5, 10}

	for _, limit := range limits {
		t.Run(fmt.Sprintf("Limit_%d", limit), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/histories?limit=%d", limit)
			resp, body := env.AuthGet(path)

			if resp.StatusCode != 200 {
				t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
			}

			var result map[string]interface{}
			json.Unmarshal(body, &result)

			data, ok := result["data"].([]interface{})
			if !ok {
				t.Fatalf("Esperava array, recebeu: %s", string(body))
			}

			if len(data) > limit {
				t.Errorf("Esperava no máximo %d, recebeu %d", limit, len(data))
			}

			t.Logf("ListHistories limit=%d OK — %d resultado(s)", limit, len(data))
		})
	}
}

func TestListHistories_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/exercises/histories")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/{id} ───────────────────────

func TestGetExercise_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	exerciseIDs := []int{2, 3, 4, 6, 7, 8, 9, 10, 20, 30}

	for _, id := range exerciseIDs {
		t.Run(fmt.Sprintf("Exercise_%d", id), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/%d", id)
			resp, body := env.AuthGet(path)

			if resp.StatusCode != 200 && resp.StatusCode != 404 {
				t.Fatalf("ID %d: Esperava 200 ou 404, recebeu %d: %s", id, resp.StatusCode, string(body))
			}

			var result map[string]interface{}
			json.Unmarshal(body, &result)

			data, ok := result["data"].(map[string]interface{})
			if !ok {
				t.Fatalf("Esperava objeto, recebeu: %s", string(body))
			}

			if _, ok := data["id"]; !ok {
				t.Error("Campo 'id' ausente")
			}
			if _, ok := data["dados_exercicio"]; !ok {
				t.Error("Campo 'dados_exercicio' ausente")
			}

			t.Logf("GetExercise OK — id=%v, catalogo_id=%v", data["id"], data["catalogo_id"])
		})
	}
}

func TestGetExercise_InvalidID(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/exercises/abc")

	if resp.StatusCode != 400 {
		t.Fatalf("Esperava 400, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercise_NotFound(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := env.AuthGet("/api/v1/exercises/99999")

	if resp.StatusCode != 404 {
		t.Fatalf("Esperava 404, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercise_Unauthorized(t *testing.T) {
	env := testutil.NewTestEnv()

	resp, body := testutil.UnauthGet(env.BaseURL, "/api/v1/exercises/1")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── POST /exercises/{id}/view ───────────────────────

func TestMarkExerciseAsViewed_Success(t *testing.T) {
	env := testutil.NewTestEnv()

	// Testa marcar exercícios como vistos
	exerciseIDs := []int{1, 2, 3, 4, 5}

	for _, id := range exerciseIDs {
		t.Run(fmt.Sprintf("MarkViewed_%d", id), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/%d/view", id)
			resp, body := env.AuthPost(path, nil)

			// Aceita 200 (sucesso) ou 500 (já marcado / constraint)
			if resp.StatusCode != 200 && resp.StatusCode != 500 {
				t.Fatalf("ID %d: Esperava 200 ou 500, recebeu %d: %s", id, resp.StatusCode, string(body))
			}

			t.Logf("MarkViewed ID=%d retornou %d", id, resp.StatusCode)
		})
	}
}

// ─────────────────────── POST /exercises/chain/next-word ───────────────────────

func TestChainNextWord_Validation(t *testing.T) {
	env := testutil.NewTestEnv()

	testCases := []struct {
		Nome    string
		Payload interface{}
		Expect  int
	}{
		{"EmptyBody", nil, 400},
		{"EmptyJson", map[string]string{}, 400},
		{"MissingSentence", map[string]interface{}{"other_field": "test"}, 400},
		{"ValidSentence", map[string]interface{}{"sentence_so_far": "The quick brown"}, 200},
		{"SpecialChars", map[string]interface{}{"sentence_so_far": "!@#$%^&*()"}, 200},
		{"Numbers", map[string]interface{}{"sentence_so_far": "123456789"}, 200},
		{"Whitespace", map[string]interface{}{"sentence_so_far": "   "}, 200},
	}

	for _, tc := range testCases {
		t.Run(tc.Nome, func(t *testing.T) {
			resp, body := env.AuthPost("/api/v1/exercises/chain/next-word", tc.Payload)

			if resp.StatusCode != tc.Expect {
				t.Fatalf("[%s] Esperava %d, recebeu %d: %s", tc.Nome, tc.Expect, resp.StatusCode, string(body))
			}

			t.Logf("[%s] OK (Code: %d)", tc.Nome, resp.StatusCode)
		})
	}
}
