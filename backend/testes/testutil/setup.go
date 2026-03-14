package testutil

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"time"

	"extension-backend/internal/anki"
	"extension-backend/internal/auth"
	"extension-backend/internal/exercises"
	"extension-backend/internal/group"
	"extension-backend/internal/http/handlers"
	apphttp "extension-backend/internal/http"
	"extension-backend/internal/phrase"
	"extension-backend/internal/settings"
	"extension-backend/internal/user"
	"extension-backend/internal/youtube"
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
	return []exercises.TipoComCatalogo{}, nil
}
func (m *MockExerciseService) GetExerciciosByCatalogo(_ context.Context, catID int, uid int, limit int) ([]exercises.Exercicio, error) {
	return []exercises.Exercicio{}, nil
}
func (m *MockExerciseService) GetByID(_ context.Context, id int) (*exercises.Exercicio, error) {
	return &exercises.Exercicio{ID: id}, nil
}
func (m *MockExerciseService) MarkExerciseAsViewed(_ context.Context, uid int, exID int) error {
	return nil
}
func (m *MockExerciseService) ListHistorias(_ context.Context, uid int, limit int) ([]exercises.Exercicio, error) {
	return []exercises.Exercicio{}, nil
}

// ─────────────────────── Test Environment ───────────────────────

type TestEnv struct {
	Server       *httptest.Server
	TokenService *user.TokenService
	UserService  *MockUserService
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
