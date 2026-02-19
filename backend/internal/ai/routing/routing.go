package routing

// Event tipos de eventos SSE
type Event struct {
	Type    string
	Payload interface{}
}

// TranslationEvent evento de tradução completa
type TranslationEvent struct {
	UserID      int               `json:"user_id"`
	PhraseID    int               `json:"phrase_id"`
	Translation string            `json:"translation"`
	Explanation string            `json:"explanation"`
	Slices      map[string]string `json:"slices"`
	Model       string            `json:"model"`
}

// ErrorEvent evento de erro
type ErrorEvent struct {
	UserID   int    `json:"user_id"`
	PhraseID int    `json:"phrase_id"`
	Error    string `json:"error"`
}

// Broadcaster interface para envio de eventos por usuário
type Broadcaster interface {
	SendTranslation(event TranslationEvent)
	SendError(event ErrorEvent)
}
