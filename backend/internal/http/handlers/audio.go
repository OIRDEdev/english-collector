package handlers

import (
	"log"
	"net/http"

	"extension-backend/internal/audio/processor"
	"extension-backend/internal/audio/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Accept connections from browser ext/web
}

// ConversationWS Handles real-time Audio STT->LLM->TTS connection
func (h *Handler) ConversationWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[Audio WS] Falha no upgrade: %v", err)
		return
	}
	// We do not defer Close() here; the Pipeline will take ownership

	// Initialize STT Factory (creates sessions per speech turn)
	sttFactory, err := service.NewElevenLabsSTTFactory()
	if err != nil {
		log.Printf("[Audio WS] Falha instanciando STT Factory: %v", err)
		conn.Close()
		return
	}

	tts, err := service.NewElevenLabsTTS()
	if err != nil {
		log.Printf("[Audio WS] Falha instanciando TTS: %v", err)
		conn.Close()
		return
	}

	llm, err := service.NewGeminiLLM()
	if err != nil {
		log.Printf("[Audio WS] Falha instanciando LLM: %v", err)
		conn.Close()
		return
	}

	// Tie them into the pipeline orchestrator
	historyManager := processor.NewHistoryManager(h.cacheClient)
	audioPipeline := processor.NewPipeline(sttFactory, tts, llm, historyManager)

	log.Println("[Audio WS] Nova conexão pipeline iniciada")
	// Block executing the loop handler until ctx is canceled/conn drops
	audioPipeline.HandleWSConnection(r.Context(), conn)
}
