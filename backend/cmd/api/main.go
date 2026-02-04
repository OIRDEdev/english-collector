package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"extension-backend/internal/database"
	"extension-backend/internal/handlers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	
	dbConfig := database.LoadConfig()
	_, err := database.Connect(dbConfig)
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

	
	r := chi.NewRouter()

	// Middleware stack
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(corsMiddleware)

	// Register routes
	handler := handlers.NewHandler()
	handler.RegisterRoutes(r)

	
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


func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
