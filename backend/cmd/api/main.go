package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"extension-backend/internal/database"
	"extension-backend/internal/group"
	apphttp "extension-backend/internal/http"
	"extension-backend/internal/http/handlers"
	"extension-backend/internal/phrase"
	"extension-backend/internal/user"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	db, err := database.Connect()
	if err != nil {
		log.Printf("Warning: Could not connect to database: %v", err)
		log.Println("Running without database connection...")
	} else {
		defer database.Close()
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize repositories
	userRepo := user.NewRepository(db)
	refreshTokenRepo := user.NewRefreshTokenRepository(db)
	phraseRepo := phrase.NewRepository(db)
	groupRepo := group.NewRepository(db)

	// Initialize services
	tokenService := user.NewTokenService()
	userService := user.NewService(userRepo, refreshTokenRepo, tokenService)
	phraseService := phrase.NewService(phraseRepo)
	groupService := group.NewService(groupRepo)

	// Initialize handler
	handler := handlers.NewHandler(userService, phraseService, groupService, tokenService)

	// Setup router
	r := apphttp.NewRouter()
	apphttp.RegisterRoutes(r, handler)

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("\nShutting down server...")
		database.Close()
		os.Exit(0)
	}()

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
