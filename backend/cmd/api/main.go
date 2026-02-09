package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"extension-backend/internal/ai"
	"extension-backend/internal/ai/processor"
	"extension-backend/internal/ai/repository"
	"extension-backend/internal/ai/routing"
	"extension-backend/internal/database"
	"extension-backend/internal/group"
	apphttp "extension-backend/internal/http"
	"extension-backend/internal/http/handlers"
	"extension-backend/internal/http/middleware"
	phraseRepo "extension-backend/internal/phrase/repository"
	phraseSvc "extension-backend/internal/phrase/service"
	"extension-backend/internal/sse"
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
	phraseRepository := phraseRepo.New(db)
	groupRepo := group.NewRepository(db)

	// Initialize services
	tokenService := user.NewTokenService()
	userService := user.NewService(userRepo, refreshTokenRepo, tokenService)
	phraseService := phraseSvc.New(phraseRepository)
	groupService := group.NewService(groupRepo)

	// Initialize SSE Hub
	sseHub := sse.NewHub()
	sseHub.Run()
	log.Println("SSE Hub started")

	// Initialize AI module
	var aiMiddleware *middleware.AIMiddleware
	aiService, err := ai.NewService()
	if err != nil {
		log.Printf("Warning: AI service not available: %v", err)
	} else {
		// Create AI module components
		translator := processor.NewTranslator(aiService)
		persister := processor.NewPersister(repository.NewPhraseAdapter(phraseService))
		notifier := processor.NewNotifier(routing.NewSSEAdapter(sseHub))

		// Assemble processor
		aiProcessor := processor.New(translator, persister, notifier)
		aiMiddleware = middleware.NewAIMiddleware(aiProcessor)
		log.Println("AI translation service enabled")
	}

	// Initialize handler
	handler := handlers.NewHandler(userService, phraseService, groupService, tokenService)

	// Setup router
	r := apphttp.NewRouter()
	apphttp.RegisterRoutes(r, handler, aiMiddleware, sseHub)

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
	log.Printf("SSE endpoint: http://localhost:%s/api/v1/sse/translations", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
