package models

import "time"


type BaseModel struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}


type User struct {
	BaseModel
	Email    string `json:"email"`
	Username string `json:"username"`
}


type Phrase struct {
	BaseModel
	UserID  string `json:"user_id"`
	Content string `json:"content"`
	Source  string `json:"source"`
	Context string `json:"context,omitempty"`
}
