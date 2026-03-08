package audio

import "context"

// STTSessionFactory creates fresh STT sessions per speech turn.
// Each recording turn should call NewSession() to get an isolated connection.
type STTSessionFactory interface {
	NewSession(ctx context.Context) (STTSession, error)
}

// STTSession is a single-turn STT connection lifecycle.
// Connect → SendAudio (N times) → Commit → WaitForTranscript → Close
type STTSession interface {
	SendAudio(audio []byte) error
	Commit() error
	WaitForTranscript() (string, error)
	Close() error
}

// TextToSpeechProvider (TTS) handles streaming text blocks to audio
type TextToSpeechProvider interface {
	// StreamText hits the TTS endpoint natively mapping text to an external output binary channel.
	StreamText(ctx context.Context, text string, out chan<- []byte) error
}

// LLMProvider processa a entrada de texto e retorna respostas streamadas em blocos lógicos.
type LLMProvider interface {
	// GenerateStream recebe uma string de entrada (como de um canal STT) e envia outputs contínuos 
	// gerados pela IA no canal de saída "out".
	GenerateStream(ctx context.Context, history []ConversationTurn, input string, out chan<- string) error
}

// Message representa as mensagens enviadas/recebidas pelo Client Socket Payload
type WebsocketMessage struct {
	Type       string `json:"type"`             // event: auth, audio, audio_end, text, setup, stt, finished
	Audio      string `json:"audio,omitempty"`  // base64 PCM chunk from frontend
	Text       string `json:"text,omitempty"`
	VoiceID    string `json:"voice_id,omitempty"`
	LanguageID int    `json:"language_id,omitempty"`
}

// ConversationTurn represents a single exchange in the session context
type ConversationTurn struct {
	Role    string `json:"role"`    // "user" or "model"
	Content string `json:"content"`
}
