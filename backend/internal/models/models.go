package models

import "time"

// BaseModel contains common fields for all models
type BaseModel struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User represents a user in the system
type User struct {
	BaseModel
	Email    string `json:"email"`
	Username string `json:"username"`
}

// Phrase represents a captured phrase from the extension
type Phrase struct {
	BaseModel
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Source  string `json:"source"`
	Context string `json:"context,omitempty"`
}
