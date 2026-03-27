package user

import (
	"os"
	"testing"
)

func TestTokenService_GenerateExtensionToken(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	ts := NewTokenService()

	u := &User{
		ID:                      123,
		Email:                   "test@example.com",
		IdiomaOrigemCodigo:      "pt",
		IdiomaAprendizadoCodigo: "en",
	}

	token, err := ts.GenerateExtensionToken(u)
	if err != nil {
		t.Fatalf("Error generating token: %v", err)
	}

	claims, err := ts.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("Error validating token: %v", err)
	}

	if claims.UserID != u.ID {
		t.Errorf("Expected UserID %d, got %d", u.ID, claims.UserID)
	}
	if claims.Email != u.Email {
		t.Errorf("Expected Email %s, got %s", u.Email, claims.Email)
	}
	if claims.NativeLang != "pt" {
		t.Errorf("Expected NativeLang 'pt', got '%s'", claims.NativeLang)
	}
	if claims.LearningLang != "en" {
		t.Errorf("Expected LearningLang 'en', got '%s'", claims.LearningLang)
	}
}

func TestTokenService_GenerateAccessToken_NoLangs(t *testing.T) {
	os.Setenv("JWT_SECRET", "test-secret")
	ts := NewTokenService()

	u := &User{
		ID:    123,
		Email: "test@example.com",
	}

	token, err := ts.GenerateAccessToken(u)
	if err != nil {
		t.Fatalf("Error generating token: %v", err)
	}

	claims, err := ts.ValidateAccessToken(token)
	if err != nil {
		t.Fatalf("Error validating token: %v", err)
	}

	if claims.NativeLang != "" {
		t.Errorf("Expected empty NativeLang, got '%s'", claims.NativeLang)
	}
}
