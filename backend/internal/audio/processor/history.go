package processor

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"extension-backend/internal/audio"
	"extension-backend/internal/cache"
)

type HistoryManager struct {
	cacheClient *cache.Client
}

func NewHistoryManager(c *cache.Client) *HistoryManager {
	return &HistoryManager{cacheClient: c}
}

func (h *HistoryManager) GetHistory(ctx context.Context, userID int) ([]audio.ConversationTurn, error) {
	key := fmt.Sprintf("conversation:%d", userID)
	data, err := h.cacheClient.Get(ctx, key)
	if err != nil {
		// Redis returns redis.Nil often, which cache client might return as an error or empty string
		return []audio.ConversationTurn{}, nil
	}
	if data == "" {
		return []audio.ConversationTurn{}, nil
	}

	var history []audio.ConversationTurn
	if err := json.Unmarshal([]byte(data), &history); err != nil {
		return nil, err
	}

	return history, nil
}

func (h *HistoryManager) AppendTurn(ctx context.Context, userID int, role string, content string) error {
	if content == "" {
		return nil
	}

	history, err := h.GetHistory(ctx, userID)
	if err != nil {
		history = []audio.ConversationTurn{}
	}

	history = append(history, audio.ConversationTurn{
		Role:    role,
		Content: content,
	})

	// Conserve memory, keep only last N turns (e.g., last 10 exchanges = 20 messages)
	if len(history) > 20 {
		history = history[len(history)-20:]
	}

	data, err := json.Marshal(history)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("conversation:%d", userID)
	// Timeout conversation after 1 hour of inactivity
	return h.cacheClient.Set(ctx, key, string(data), 1*time.Hour)
}

func (h *HistoryManager) ClearHistory(ctx context.Context, userID int) error {
	key := fmt.Sprintf("conversation:%d", userID)
	return h.cacheClient.Delete(ctx, key)
}
