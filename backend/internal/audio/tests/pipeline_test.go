package tests

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"extension-backend/internal/audio"
	"extension-backend/internal/audio/processor"

	"github.com/gorilla/websocket"
)

// ========= Mocks =========

// mockSTTSession implements audio.STTSession
type mockSTTSession struct {
	audioReceived [][]byte
	transcript    string
}

func (m *mockSTTSession) SendAudio(data []byte) error {
	m.audioReceived = append(m.audioReceived, data)
	return nil
}

func (m *mockSTTSession) Commit() error {
	return nil
}

func (m *mockSTTSession) WaitForTranscript() (string, error) {
	return m.transcript, nil
}

func (m *mockSTTSession) Close() error {
	return nil
}

// mockSTTFactory implements audio.STTSessionFactory
type mockSTTFactory struct {
	nextTranscript string
}

func (f *mockSTTFactory) NewSession(ctx context.Context) (audio.STTSession, error) {
	return &mockSTTSession{
		transcript: f.nextTranscript,
	}, nil
}

type mockTTS struct{}

func (m *mockTTS) StreamText(ctx context.Context, text string, out chan<- []byte) error {
	out <- []byte("mock-mp3: " + text)
	return nil
}

type mockLLM struct{}

func (m *mockLLM) GenerateStream(ctx context.Context, history []audio.ConversationTurn, input string, out chan<- string) error {
	out <- "ai says: " + input
	time.Sleep(10 * time.Millisecond)
	out <- " done."
	return nil
}

// ========= Tests =========

func TestAudioPipeline_WSFlow(t *testing.T) {
	factory := &mockSTTFactory{nextTranscript: "hello"}
	tts := &mockTTS{}
	llm := &mockLLM{}

	pipeline := processor.NewPipeline(factory, tts, llm, nil)

	// Set up a local test HTTP server to test websockets
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("failed to upgrade: %v", err)
		}
		pipeline.HandleWSConnection(r.Context(), conn)
	}))
	defer server.Close()

	// Convert http:// link to ws://
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	// Connect as a client
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to dial: %v", err)
	}
	defer conn.Close()

	// 1. Send setup
	err = conn.WriteJSON(audio.WebsocketMessage{Type: "setup"})
	if err != nil {
		t.Fatalf("failed to send setup: %v", err)
	}

	// 2. Send audio chunk (triggers session creation)
	err = conn.WriteJSON(audio.WebsocketMessage{
		Type:  "audio",
		Audio: "dGVzdC1hdWRpby1ieXRlcw==", // base64 encoded fake PCM
	})
	if err != nil {
		t.Fatalf("failed to send audio: %v", err)
	}

	// 3. Send audio_end (triggers commit → transcript → LLM → TTS)
	err = conn.WriteJSON(audio.WebsocketMessage{Type: "audio_end"})
	if err != nil {
		t.Fatalf("failed to send audio_end: %v", err)
	}

	// 4. Read responses: expect stt, text(s), audio(s)
	receivedTypes := map[string]int{}
	for i := 0; i < 5; i++ {
		conn.SetReadDeadline(time.Now().Add(2 * time.Second))
		_, msg, err := conn.ReadMessage()
		if err != nil {
			// May timeout after getting all messages, which is acceptable
			break
		}

		var payload audio.WebsocketMessage
		if err := json.Unmarshal(msg, &payload); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		receivedTypes[payload.Type]++
	}

	// We must have received at least an STT event
	if receivedTypes["stt"] < 1 {
		t.Errorf("Expected at least 1 stt event, got %d. All received: %v", receivedTypes["stt"], receivedTypes)
	}

	// We should have received text events from LLM
	if receivedTypes["text"] < 1 {
		t.Errorf("Expected at least 1 text event, got %d. All received: %v", receivedTypes["text"], receivedTypes)
	}
}
