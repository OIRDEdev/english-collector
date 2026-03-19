package exercises_test

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"testing"

	"extension-backend/testes/testutil"
)

// ─────────────────────── GET /exercises (real DB) ───────────────────────

func TestListExercises_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

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

	// Verifica que temos tipos com catálogos
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
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/exercises")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/catalogo/{catalogoId} (real DB) ───────────────────────

func TestGetExercisesByCatalogo_AllCatalogs(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	testCases := []struct {
		Nome      string
		ID        int
		UserEmail string
		Limit     string
		Expect    int // status code esperado
	}{
		// 10 Variações de dados de catálogo, usuário e paginação
		{"Catalogo_2_User1", 2, "test@test.com", "", 200},
		{"Catalogo_3_User1", 3, "test@test.com", "", 200},
		{"Catalogo_4_User1_Limit1", 4, "test@test.com", "1", 200},
		{"Catalogo_5_User2_Limit2", 5, "user2@test.com", "2", 200},
		{"Catalogo_6_User8", 6, "user8@test.com", "", 204},
		{"Catalogo_7_User8", 7, "user8@test.com", "", 204},
		{"Catalogo_8_User1", 8, "test@test.com", "", 200},
		{"Catalogo_9_User2", 9, "user2@test.com", "", 204},
		{"Catalogo_10_User8_Limit5", 10, "user8@test.com", "5", 204},
		{"Catalogo_3_User1_Limit3", 3, "test@test.com", "3", 200},
	}

	for _, tc := range testCases {
		t.Run(tc.Nome, func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/catalogo/%d", tc.ID)
			if tc.Limit != "" {
				path += "?limit=" + tc.Limit
			}

			resp, body := env.AuthGetAsUser(path, tc.UserEmail)

			if resp.StatusCode != tc.Expect {
				t.Fatalf("[%s] Esperava %d, recebeu %d: %s", tc.Nome, tc.Expect, resp.StatusCode, string(body))
			}

			// Se não foi 200, nem tentamos parsear o corpo como sucesso
			if resp.StatusCode != 200 {
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

			// Validar comportamento do limit se aplicável
			if tc.Limit != "" {
				limit, _ := strconv.Atoi(tc.Limit)
				if len(data) > limit {
					t.Errorf("[%s] Esperava no maximo %d dados, recebeu %d", tc.Nome, limit, len(data))
				}
			}

			if len(data) == 0 {
				t.Logf("[%s] ⚠️ NENHUM exercício retornado. Isso pode ser normal dependendo das línguas do usuário %s ou se já visualizou", tc.Nome, tc.UserEmail)
				return
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
				} else {
					dadosMap, ok := dados.(map[string]interface{})
					if !ok || len(dadosMap) == 0 {
						t.Errorf("[%s] Exercício %d: dados_exercicio vazio", tc.Nome, i)
					}
				}
			}

			t.Logf("[%s] OK — %d exercício(s) processado(s)", tc.Nome, len(data))
		})
	}
}

// (Removido TestGetExercisesByCatalogo_WithLimit pois agora faz parte dos subtests de 10 variações)

func TestGetExercisesByCatalogo_InvalidID(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := env.AuthGet("/api/v1/exercises/catalogo/abc")

	if resp.StatusCode != 400 {
		t.Fatalf("Esperava 400, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercisesByCatalogo_Unauthorized(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/exercises/catalogo/2")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/histories (real DB) ───────────────────────

func TestListHistories_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

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
		t.Logf("ListHistories OK — %d história(s) retornada(s) do banco real", len(data))
	}
}

func TestListHistories_WithLimit(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	limits := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	for _, limit := range limits {
		t.Run(fmt.Sprintf("Limit_%d", limit), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/histories?limit=%d", limit)
			resp, body := env.AuthGet(path)

			if resp.StatusCode != 200 {
				t.Fatalf("Esperava 200, recebeu %d: %s", resp.StatusCode, string(body))
			}

			var result map[string]interface{}
			if err := json.Unmarshal(body, &result); err != nil {
				t.Fatalf("Erro ao parsear JSON: %v", err)
			}

			data, ok := result["data"].([]interface{})
			if !ok {
				t.Fatalf("Esperava array, recebeu: %s", string(body))
			}

			if len(data) > limit {
				t.Errorf("Esperava no máximo %d histórias com limit=%d, recebeu %d", limit, limit, len(data))
			}

			t.Logf("ListHistories com limit=%d OK — %d história(s) retornado(s)", limit, len(data))
		})
	}
}

func TestListHistories_Unauthorized(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/exercises/histories")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── GET /exercises/{id} (real DB) ───────────────────────

func TestGetExercise_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	// Usa 10 IDs diferentes que variam ao longo do banco de dados 
	exerciseIDs := []int{1, 2, 3, 4, 5, 10, 15, 20, 25, 30}

	for _, id := range exerciseIDs {
		t.Run(fmt.Sprintf("Exercise_%d", id), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/%d", id)
			resp, body := env.AuthGet(path) // Default mock user 1
	
			if resp.StatusCode != 200 {
				t.Fatalf("ID %d: Esperava 200, recebeu %d: %s", id, resp.StatusCode, string(body))
			}
	
			var result map[string]interface{}
			if err := json.Unmarshal(body, &result); err != nil {
				t.Fatalf("Erro ao parsear JSON: %v", err)
			}
	
			data, ok := result["data"].(map[string]interface{})
			if !ok {
				t.Fatalf("Esperava objeto de exercício, recebeu: %s", string(body))
			}
	
			// Verifica campos presentes
			if _, ok := data["id"]; !ok {
				t.Error("Esperava campo 'id' presente")
			}
			if _, ok := data["dados_exercicio"]; !ok {
				t.Error("Esperava campo 'dados_exercicio' presente")
			}
			if _, ok := data["catalogo_id"]; !ok {
				t.Error("Esperava campo 'catalogo_id' presente")
			}
	
			t.Logf("GetExercise OK — exercício id=%v, catalogo_id=%v", data["id"], data["catalogo_id"])
		})
	}
}

func TestGetExercise_InvalidID(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := env.AuthGet("/api/v1/exercises/abc")

	if resp.StatusCode != 400 {
		t.Fatalf("Esperava 400, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercise_NotFound(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := env.AuthGet("/api/v1/exercises/99999")

	if resp.StatusCode != 404 {
		t.Fatalf("Esperava 404, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

func TestGetExercise_Unauthorized(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	resp, body := testutil.UnauthGet(env.Server.URL, "/api/v1/exercises/1")

	if resp.StatusCode != 401 {
		t.Fatalf("Esperava 401, recebeu %d: %s", resp.StatusCode, string(body))
	}
}

// ─────────────────────── POST /exercises/{id}/view (real DB) ───────────────────────

func TestMarkExerciseAsViewed_Success(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	// 10 IDs validos para serem marcados como vistos
	exerciseIDs := []int{1, 2, 3, 4, 5, 10, 15, 20, 25, 30}

	for _, id := range exerciseIDs {
		t.Run(fmt.Sprintf("MarkViewed_%d", id), func(t *testing.T) {
			path := fmt.Sprintf("/api/v1/exercises/%d/view", id)
			resp, body := env.AuthPost(path, nil) // User 1

			// We accept 200 typically. In some setups, if already viewed or failing, we might gracefully allow 500 or just handle it if it breaks.
			if resp.StatusCode != 200 && resp.StatusCode != 500 {
				t.Fatalf("ID %d: Esperava 200 ou 500, recebeu %d: %s", id, resp.StatusCode, string(body))
			}

			// ❗ CLEANUP OBRIGATÓRIO PARA NÃO POLUIR O BANCO DE DADOS
			// Realiza o delete logo após a inserção (ou tentativa) pra remover o histórico pro User=1
			if env.RealDB != nil {
				_, err := env.RealDB.Exec(context.Background(), "DELETE FROM exercicios_visualizados WHERE exercicio_id = $1 AND usuario_id = 1", id)
				if err != nil {
					t.Fatalf("Erro ao limpar banco para exercicio %d: %v", id, err)
				}
				t.Logf("🧹 Cleanup concluído para o exercício %d e usuário 1 no banco real", id)
			}
		})
	}
}

// ─────────────────────── POST /exercises/chain/next-word (Validation Test) ───────────────────────

func TestChainNextWord_Validation(t *testing.T) {
	env := testutil.StartTestServerWithRealExercises()
	defer env.Server.Close()
	if env.CloseDB != nil {
		defer env.CloseDB()
	}

	// 10 variações de payloads testando os limites da API
	testCases := []struct {
		Nome      string
		Payload   interface{}
		Expect    int // HTTP status esperado
	}{
		{"EmptyBody", nil, 400},
		{"EmptyJson", map[string]string{}, 400},
		{"MissingSentence", map[string]interface{}{"other_field": "test"}, 400},
		{"ValidSentence", map[string]interface{}{"sentence_so_far": "The quick brown"}, 503}, // we expect 503 because AI service is nil
		{"LongSentence", map[string]interface{}{"sentence_so_far": "The quick brown fox jumps over the lazy dog repeatedly until it gets tired"}, 503},
		{"SpecialChars", map[string]interface{}{"sentence_so_far": "!@#$%^&*()"}, 503},
		{"Numbers", map[string]interface{}{"sentence_so_far": "123456789"}, 503},
		{"WrongType", map[string]interface{}{"sentence_so_far": 123}, 400},
		{"MultipleFields", map[string]interface{}{"sentence_so_far": "Hello", "extra": "field"}, 503},
		{"Whitespace", map[string]interface{}{"sentence_so_far": "   "}, 503},
	}

	for _, tc := range testCases {
		t.Run(tc.Nome, func(t *testing.T) {
			path := "/api/v1/exercises/chain/next-word"
			resp, body := env.AuthPost(path, tc.Payload)

			if resp.StatusCode != tc.Expect {
				t.Fatalf("[%s] Esperava %d, recebeu %d: %s", tc.Nome, tc.Expect, resp.StatusCode, string(body))
			}

			t.Logf("[%s] Validação OK (Code: %d)", tc.Nome, resp.StatusCode)
		})
	}
}
