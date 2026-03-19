package testutil

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"time"

	"extension-backend/internal/anki"
	"extension-backend/internal/auth"
	"extension-backend/internal/exercises"
	exerciseRepo "extension-backend/internal/exercises/repository"
	exerciseSvc "extension-backend/internal/exercises/service"
	"extension-backend/internal/group"
	"extension-backend/internal/http/handlers"
	apphttp "extension-backend/internal/http"
	"extension-backend/internal/phrase"
	"extension-backend/internal/settings"
	"extension-backend/internal/user"
	"extension-backend/internal/youtube"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// ─────────────────────── Mock User Service ───────────────────────

type MockUserService struct {
	Users  map[string]*user.User // email → user
	Tokens map[string]*user.AuthTokens
}

func NewMockUserService() *MockUserService {
	return &MockUserService{
		Users:  make(map[string]*user.User),
		Tokens: make(map[string]*user.AuthTokens),
	}
}

func (m *MockUserService) Create(_ context.Context, input user.CreateInput) (*user.User, error) {
	u := &user.User{ID: len(m.Users) + 1, Nome: input.Nome, Email: input.Email, CriadoEm: time.Now()}
	m.Users[input.Email] = u
	return u, nil
}

func (m *MockUserService) GetByID(_ context.Context, id string) (*user.User, error) {
	for _, u := range m.Users {
		if fmt.Sprintf("%d", u.ID) == id {
			return u, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func (m *MockUserService) GetAll(_ context.Context) ([]user.User, error) {
	var list []user.User
	for _, u := range m.Users {
		list = append(list, *u)
	}
	return list, nil
}

func (m *MockUserService) Update(_ context.Context, id string, input user.UpdateInput) (*user.User, error) {
	return nil, nil
}

func (m *MockUserService) Delete(_ context.Context, id string) error { return nil }

func (m *MockUserService) Register(_ context.Context, input user.RegisterInput, ip, ua string) (*user.AuthTokens, error) {
	if _, exists := m.Users[input.Email]; exists {
		return nil, fmt.Errorf("email already registered")
	}
	u := &user.User{ID: len(m.Users) + 1, Nome: input.Nome, Email: input.Email, CriadoEm: time.Now()}
	m.Users[input.Email] = u

	ts := user.NewTokenService()
	access, _ := ts.GenerateAccessToken(u)
	tokens := &user.AuthTokens{AccessToken: access, RefreshToken: "mock-refresh-token", ExpiresIn: 3600}
	m.Tokens[input.Email] = tokens
	return tokens, nil
}

func (m *MockUserService) Login(_ context.Context, input user.LoginInput, ip, ua string) (*user.AuthTokens, error) {
	u, exists := m.Users[input.Email]
	if !exists {
		return nil, fmt.Errorf("invalid credentials")
	}
	if input.Senha != "test123" { // senha fixa para testes
		return nil, fmt.Errorf("invalid credentials")
	}
	ts := user.NewTokenService()
	access, _ := ts.GenerateAccessToken(u)
	tokens := &user.AuthTokens{AccessToken: access, RefreshToken: "mock-refresh-token", ExpiresIn: 3600}
	return tokens, nil
}

func (m *MockUserService) RefreshTokens(_ context.Context, rt, ip, ua string) (*user.AuthTokens, error) {
	return nil, fmt.Errorf("not implemented")
}

func (m *MockUserService) GetByEmail(_ context.Context, email string) (*user.User, error) {
	u, exists := m.Users[email]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	return u, nil
}

func (m *MockUserService) LoginWithoutPassword(_ context.Context, email, ip, ua string) (*user.AuthTokens, error) {
	u, exists := m.Users[email]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	ts := user.NewTokenService()
	access, _ := ts.GenerateAccessToken(u)
	return &user.AuthTokens{AccessToken: access, RefreshToken: "mock-refresh", ExpiresIn: 3600}, nil
}

// ─────────────────────── Mock Phrase Service ───────────────────────

type MockPhraseService struct{}

func (m *MockPhraseService) Create(_ context.Context, input phrase.CreateInput) (*phrase.Phrase, error) {
	return &phrase.Phrase{ID: 1, Conteudo: input.Conteudo, UsuarioID: input.UsuarioID}, nil
}
func (m *MockPhraseService) GetByID(_ context.Context, id string) (*phrase.Phrase, error) {
	return &phrase.Phrase{ID: 1, Conteudo: "test phrase"}, nil
}
func (m *MockPhraseService) GetByUserID(_ context.Context, uid int) ([]phrase.Phrase, error) {
	return []phrase.Phrase{}, nil
}
func (m *MockPhraseService) GetAll(_ context.Context) ([]phrase.Phrase, error) {
	return []phrase.Phrase{}, nil
}
func (m *MockPhraseService) Update(_ context.Context, id string, input phrase.UpdateInput) (*phrase.Phrase, error) {
	return nil, nil
}
func (m *MockPhraseService) Delete(_ context.Context, id string) error { return nil }
func (m *MockPhraseService) Search(_ context.Context, uid int, term string) ([]phrase.Phrase, error) {
	return nil, nil
}
func (m *MockPhraseService) AddDetails(_ context.Context, input phrase.CreateDetailsInput) (*phrase.PhraseDetails, error) {
	return nil, nil
}
func (m *MockPhraseService) GetDetails(_ context.Context, phraseID int) (*phrase.PhraseDetails, error) {
	return nil, nil
}
func (m *MockPhraseService) GetAllPaginated(_ context.Context, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	return &phrase.PaginatedResult[phrase.PhraseWithDetails]{Data: []phrase.PhraseWithDetails{}, HasMore: false}, nil
}
func (m *MockPhraseService) GetByUserIDPaginated(_ context.Context, uid int, params phrase.PaginationParams) (*phrase.PaginatedResult[phrase.PhraseWithDetails], error) {
	return &phrase.PaginatedResult[phrase.PhraseWithDetails]{Data: []phrase.PhraseWithDetails{}, HasMore: false}, nil
}

// ─────────────────────── Mock Group Service ───────────────────────

type MockGroupService struct{}

func (m *MockGroupService) Create(_ context.Context, input group.CreateInput) (*group.Group, error) {
	return &group.Group{ID: 1, NomeGrupo: input.NomeGrupo, UsuarioID: input.UsuarioID}, nil
}
func (m *MockGroupService) GetByID(_ context.Context, id string) (*group.Group, error) {
	return &group.Group{ID: 1, NomeGrupo: "test"}, nil
}
func (m *MockGroupService) GetByUserID(_ context.Context, uid int) ([]group.Group, error) {
	return []group.Group{}, nil
}
func (m *MockGroupService) GetAll(_ context.Context) ([]group.Group, error) {
	return []group.Group{}, nil
}
func (m *MockGroupService) Update(_ context.Context, id string, input group.UpdateInput) (*group.Group, error) {
	return nil, nil
}
func (m *MockGroupService) Delete(_ context.Context, id string) error { return nil }
func (m *MockGroupService) AddPhrase(_ context.Context, phraseID, groupID int) error {
	return nil
}
func (m *MockGroupService) RemovePhrase(_ context.Context, phraseID, groupID int) error {
	return nil
}
func (m *MockGroupService) GetPhraseGroups(_ context.Context, phraseID int) ([]group.Group, error) {
	return nil, nil
}

// ─────────────────────── Mock Anki Service ───────────────────────

type MockAnkiService struct{}

func (m *MockAnkiService) GetDueCards(_ context.Context, uid int) ([]anki.AnkiCard, error) {
	return []anki.AnkiCard{}, nil
}
func (m *MockAnkiService) SubmitReview(_ context.Context, uid int, input anki.ReviewInput) (*anki.ReviewResult, error) {
	if input.AnkiID == 0 || input.Nota == 0 {
		return nil, fmt.Errorf("invalid input")
	}
	return &anki.ReviewResult{}, nil
}
func (m *MockAnkiService) GetStats(_ context.Context, uid int) (*anki.SessionStats, error) {
	return &anki.SessionStats{}, nil
}

// ─────────────────────── Mock Exercise Service ───────────────────────

type MockExerciseService struct{}

func (m *MockExerciseService) ListTiposComCatalogo(_ context.Context) ([]exercises.TipoComCatalogo, error) {
	return []exercises.TipoComCatalogo{
		{
			Tipo: exercises.TipoExercicio{ID: 1, Nome: "Memória"},
			Catalogos: []exercises.CatalogoItem{
				{ID: 7, Nome: "key", TipoID: 1, TipoNome: "Memória", Ativo: true},
				{ID: 9, Nome: "WordMemory", TipoID: 1, TipoNome: "Memória", Ativo: true},
			},
		},
		{
			Tipo: exercises.TipoExercicio{ID: 3, Nome: "Linguagem"},
			Catalogos: []exercises.CatalogoItem{
				{ID: 10, Nome: "Connection", TipoID: 3, TipoNome: "Linguagem", Ativo: true},
			},
		},
		{
			Tipo: exercises.TipoExercicio{ID: 4, Nome: "Vocabulario"},
			Catalogos: []exercises.CatalogoItem{
				{ID: 5, Nome: "NexusConnect", TipoID: 4, TipoNome: "Vocabulario", Ativo: true},
				{ID: 8, Nome: "SentenceChain", TipoID: 4, TipoNome: "Vocabulario", Ativo: true},
			},
		},
		{
			Tipo: exercises.TipoExercicio{ID: 5, Nome: "Escrita"},
			Catalogos: []exercises.CatalogoItem{
				{ID: 2, Nome: "ClaritySprint", TipoID: 5, TipoNome: "Escrita", Ativo: true},
				{ID: 3, Nome: "EchoWrite", TipoID: 5, TipoNome: "Escrita", Ativo: true},
				{ID: 4, Nome: "LogicBreaker", TipoID: 5, TipoNome: "Escrita", Ativo: true},
			},
		},
		{
			Tipo: exercises.TipoExercicio{ID: 6, Nome: "Interpretação"},
			Catalogos: []exercises.CatalogoItem{
				{ID: 6, Nome: "historia", TipoID: 6, TipoNome: "Interpretação", Ativo: true},
			},
		},
	}, nil
}

func (m *MockExerciseService) GetExerciciosByCatalogo(_ context.Context, catID int, uid int, limit int) ([]exercises.Exercicio, error) {
	// Retorna exercícios realistas por catálogo
	mockData := map[int][]exercises.Exercicio{
		2: {{ID: 1, CatalogoID: 2, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Remova palavras extras", "tempo_leitura": 60}}},
		3: {{ID: 2, CatalogoID: 3, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Ouça e digite a frase", "audio_url": "https://api.polylang.com/audio/1.mp3"}}},
		4: {{ID: 5, CatalogoID: 4, Nivel: 2, DadosExercicio: map[string]interface{}{"instrucao": "Ache a falha lógica", "texto": "Test sentence"}}},
		5: {{ID: 10, CatalogoID: 5, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Conecte as palavras", "palavras": []string{"hello", "world"}}}},
		6: {{ID: 15, CatalogoID: 6, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Leia a história", "texto": "Once upon a time..."}}},
		7: {{ID: 20, CatalogoID: 7, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Memorize a sequência", "palavras": []string{"apple", "banana"}}}},
		8: {{ID: 25, CatalogoID: 8, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Complete a frase", "frase": "The cat sat on the ___"}}},
		9: {{ID: 30, CatalogoID: 9, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Memorize a palavra", "palavra": "serendipity"}}},
		10: {{ID: 35, CatalogoID: 10, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Conecte os conceitos", "pares": []string{"big-small", "hot-cold"}}}},
	}

	if exs, ok := mockData[catID]; ok {
		if limit > 0 && limit < len(exs) {
			return exs[:limit], nil
		}
		return exs, nil
	}
	return []exercises.Exercicio{}, nil
}

func (m *MockExerciseService) GetByID(_ context.Context, id int) (*exercises.Exercicio, error) {
	if id == 99999 {
		return nil, fmt.Errorf("exercise not found")
	}
	return &exercises.Exercicio{
		ID:             id,
		CatalogoID:     2,
		Nivel:          1,
		DadosExercicio: map[string]interface{}{"instrucao": "Test exercise", "texto": "Sample text"},
	}, nil
}

func (m *MockExerciseService) MarkExerciseAsViewed(_ context.Context, uid int, exID int) error {
	return nil
}

func (m *MockExerciseService) ListHistorias(_ context.Context, uid int, limit int) ([]exercises.Exercicio, error) {
	historias := []exercises.Exercicio{
		{ID: 15, CatalogoID: 6, Nivel: 1, DadosExercicio: map[string]interface{}{"instrucao": "Leia a história", "texto": "Once upon a time..."}},
		{ID: 16, CatalogoID: 6, Nivel: 2, DadosExercicio: map[string]interface{}{"instrucao": "Leia a história", "texto": "In a faraway land..."}},
	}
	if limit > 0 && limit < len(historias) {
		return historias[:limit], nil
	}
	return historias, nil
}

// ─────────────────────── Test Environment ───────────────────────

type TestEnv struct {
	Server       *httptest.Server
	TokenService *user.TokenService
	UserService  *MockUserService
	CloseDB      func()         // fecha pool do DB real (nil se mock)
	RealDB       *pgxpool.Pool  // acesso direto ao DB para cleanup
}

// StartTestServer boots a full Chi router with mock services and returns a test HTTP server.
func StartTestServer() *TestEnv {
	tokenService := user.NewTokenService()
	mockUserSvc := NewMockUserService()

	// Seed a default test user
	mockUserSvc.Users["test@test.com"] = &user.User{
		ID:        1,
		Nome:      "Test User",
		Email:     "test@test.com",
		SenhaHash: "", // not checked directly — Login mock checks "test123"
		CriadoEm:  time.Now(),
	}

	// Auth
	authSvc := auth.NewService(mockUserSvc)
	authHandler := auth.NewHandler(authSvc, mockUserSvc)

	// Settings — uses concrete *Service, so we pass a nil-repo backed service
	// (tests for settings will get 500 from nil DB, which is expected for mock)
	settingsService := settings.NewService(nil)
	settingsHandler := settings.NewHandler(settingsService)

	// YouTube
	ytService := youtube.NewService(nil)
	ytHandler := youtube.NewHandler(ytService)

	// Main handler
	handler := handlers.NewHandler(
		mockUserSvc,
		&MockPhraseService{},
		&MockGroupService{},
		tokenService,
		&MockAnkiService{},
		&MockExerciseService{},
		nil, // ai service
		nil, // cache client
	)

	// Router
	r := apphttp.NewRouter()
	apphttp.RegisterRoutes(r, handler, authHandler, settingsHandler, ytHandler, nil, nil, nil, tokenService)

	ts := httptest.NewServer(r)

	return &TestEnv{
		Server:       ts,
		TokenService: tokenService,
		UserService:  mockUserSvc,
	}
}

// ─────────── Real DB helpers ───────────────────────────────────

// loadEnv loads backend/.env by finding it relative to this file's location.
func loadEnv() {
	_, filename, _, _ := runtime.Caller(0)
	envPath := filepath.Join(filepath.Dir(filename), "..", "..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Printf("Warning: could not load .env from %s: %v", envPath, err)
	}
}

// connectRealDB creates a pgxpool connection using DATABASE_URL from .env
func connectRealDB() *pgxpool.Pool {
	loadEnv()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		panic("DATABASE_URL not set — check backend/.env")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		panic("failed to connect to DB: " + err.Error())
	}
	if err := pool.Ping(ctx); err != nil {
		panic("failed to ping DB: " + err.Error())
	}
	log.Println("[test] Connected to real DB")
	return pool
}

// StartTestServerWithRealExercises boots a test server where the exercise
// service uses the REAL database (Neon PostgreSQL), while all other services
// remain mocked. This allows true integration testing of exercise queries.
// The test user ID=1 matches Edrio in the real DB (idioma_origem=7, idioma_aprendizado=1).
func StartTestServerWithRealExercises() *TestEnv {
	pool := connectRealDB()

	tokenService := user.NewTokenService()
	mockUserSvc := NewMockUserService()

	// Seed test users with different IDs mapping to the DB
	// User ID 1: Edrio (idioma_origem=7, idioma_aprendizado=1)
	mockUserSvc.Users["test@test.com"] = &user.User{
		ID:        1,
		Nome:      "Edrio",
		Email:     "test@test.com",
		SenhaHash: "",
		CriadoEm:  time.Now(),
	}
	
	// User ID 2: Simulated user without languages or different setup
	mockUserSvc.Users["user2@test.com"] = &user.User{
		ID:        2,
		Nome:      "User 2",
		Email:     "user2@test.com",
		SenhaHash: "",
		CriadoEm:  time.Now(),
	}

	// User ID 8: Simulated user 8
	mockUserSvc.Users["user8@test.com"] = &user.User{
		ID:        8,
		Nome:      "User 8",
		Email:     "user8@test.com",
		SenhaHash: "",
		CriadoEm:  time.Now(),
	}

	// Auth (mock)
	authSvc := auth.NewService(mockUserSvc)
	authHandler := auth.NewHandler(authSvc, mockUserSvc)

	// Settings / YouTube (mock)
	settingsHandler := settings.NewHandler(settings.NewService(nil))
	ytHandler := youtube.NewHandler(youtube.NewService(nil))

	// Exercise — REAL repo + service backed by real DB
	realExerciseRepo := exerciseRepo.New(pool)
	realExerciseSvc := exerciseSvc.New(realExerciseRepo)

	handler := handlers.NewHandler(
		mockUserSvc,
		&MockPhraseService{},
		&MockGroupService{},
		tokenService,
		&MockAnkiService{},
		realExerciseSvc,
		nil, // ai service
		nil, // cache client
	)

	r := apphttp.NewRouter()
	apphttp.RegisterRoutes(r, handler, authHandler, settingsHandler, ytHandler, nil, nil, nil, tokenService)

	ts := httptest.NewServer(r)

	return &TestEnv{
		Server:       ts,
		TokenService: tokenService,
		UserService:  mockUserSvc,
		CloseDB:      pool.Close,
		RealDB:       pool,
	}
}

// ─────────────────────── Helper Functions ───────────────────────

// LoginAndGetCookie logs in as the test user and returns the access_token cookie.
func (env *TestEnv) LoginAndGetCookie() *http.Cookie {
	body, _ := json.Marshal(map[string]string{
		"email": "test@test.com",
		"senha": "test123",
	})
	resp, err := http.Post(env.Server.URL+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		panic("failed to login in test: " + err.Error())
	}
	defer resp.Body.Close()

	for _, c := range resp.Cookies() {
		if c.Name == "access_token" {
			return c
		}
	}
	return nil
}

// AuthGet makes an authenticated GET request.
func (env *TestEnv) AuthGet(path string) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	req, _ := http.NewRequest("GET", env.Server.URL+path, nil)
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

// AuthGetAsUser makes an authenticated GET request impersonating a specific user email
func (env *TestEnv) AuthGetAsUser(path string, email string) (*http.Response, []byte) {
	body, _ := json.Marshal(map[string]string{
		"email": email,
		"senha": "test123",
	})
	loginResp, err := http.Post(env.Server.URL+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		panic("failed to login in test: " + err.Error())
	}
	defer loginResp.Body.Close()

	var cookie *http.Cookie
	for _, c := range loginResp.Cookies() {
		if c.Name == "access_token" {
			cookie = c
			break
		}
	}

	req, _ := http.NewRequest("GET", env.Server.URL+path, nil)
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

// AuthPost makes an authenticated POST request.
func (env *TestEnv) AuthPost(path string, payload any) (*http.Response, []byte) {
	cookie := env.LoginAndGetCookie()
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", env.Server.URL+path, bytes.NewReader(body))
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

// AuthPostAsUser makes an authenticated POST request impersonating a specific user email
func (env *TestEnv) AuthPostAsUser(path string, email string, payload any) (*http.Response, []byte) {
	body, _ := json.Marshal(map[string]string{
		"email": email,
		"senha": "test123",
	})
	loginResp, err := http.Post(env.Server.URL+"/api/v1/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		panic("failed to login in test: " + err.Error())
	}
	defer loginResp.Body.Close()

	var cookie *http.Cookie
	for _, c := range loginResp.Cookies() {
		if c.Name == "access_token" {
			cookie = c
			break
		}
	}

	payloadBody, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", env.Server.URL+path, bytes.NewReader(payloadBody))
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

// UnauthGet makes a GET request without any auth cookie.
func UnauthGet(serverURL, path string) (*http.Response, []byte) {
	resp, err := http.Get(serverURL + path)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// UnauthPost makes a POST request without any auth cookie.
func UnauthPost(serverURL, path string, payload any) (*http.Response, []byte) {
	body, _ := json.Marshal(payload)
	resp, err := http.Post(serverURL+path, "application/json", bytes.NewReader(body))
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	return resp, data
}

// Ensure interface compliance at compile time
var _ user.ServiceInterface = (*MockUserService)(nil)
var _ phrase.ServiceInterface = (*MockPhraseService)(nil)
var _ group.ServiceInterface = (*MockGroupService)(nil)
var _ anki.ServiceInterface = (*MockAnkiService)(nil)
var _ exercises.ServiceInterface = (*MockExerciseService)(nil)
