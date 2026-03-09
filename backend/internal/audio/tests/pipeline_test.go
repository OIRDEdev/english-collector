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

func (m *mockSTTSession) WaitForTranscript(ctx context.Context) (string, error) {
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

func TestAudioPipeline_FullTurn(t *testing.T) {
	factory := &mockSTTFactory{nextTranscript: "hello"}
	tts := &mockTTS{}
	llm := &mockLLM{}

	pipeline := processor.NewPipeline(factory, tts, llm, nil)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upgrader := websocket.Upgrader{}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("failed to upgrade: %v", err)
		}
		pipeline.HandleWSConnection(r.Context(), conn)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("failed to dial: %v", err)
	}
	defer conn.Close()

	// 1. Send setup
	if err := conn.WriteJSON(audio.WebsocketMessage{Type: "setup"}); err != nil {
		t.Fatalf("failed to send setup: %v", err)
	}

	// 2. Send audio chunk (triggers session creation)
	if err := conn.WriteJSON(audio.WebsocketMessage{
		Type:  "audio",
		Audio: "dGVzdC1hdWRpby1ieXRlcw==",
	}); err != nil {
		t.Fatalf("failed to send audio: %v", err)
	}

	// 3. Send audio_end (triggers commit → transcript → LLM → TTS)
	if err := conn.WriteJSON(audio.WebsocketMessage{Type: "audio_end"}); err != nil {
		t.Fatalf("failed to send audio_end: %v", err)
	}

	// 4. Read all responses from the turn
	received := map[string]int{}
	for i := 0; i < 10; i++ {
		conn.SetReadDeadline(time.Now().Add(3 * time.Second))
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var payload audio.WebsocketMessage
		if err := json.Unmarshal(msg, &payload); err != nil {
			t.Fatalf("failed to unmarshal: %v", err)
		}
		received[payload.Type]++
	}

	// Validate expected events: stt, text(s), audio(s), tts_end
	if received["stt"] < 1 {
		t.Errorf("Expected at least 1 stt event, got %d. Received: %v", received["stt"], received)
	}
	if received["text"] < 1 {
		t.Errorf("Expected at least 1 text event, got %d. Received: %v", received["text"], received)
	}
	if received["audio"] < 1 {
		t.Errorf("Expected at least 1 audio event, got %d. Received: %v", received["audio"], received)
	}
	if received["tts_end"] < 1 {
		t.Errorf("Expected at least 1 tts_end event, got %d. Received: %v", received["tts_end"], received)
	}
}
