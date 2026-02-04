package repository

import (
	"context"
	"fmt"
	"time"

	"extension-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)


type PhraseRepository struct {
	db *pgxpool.Pool
}
func NewPhraseRepository(db *pgxpool.Pool) *PhraseRepository {
	return &PhraseRepository{db: db}
}


func (r *PhraseRepository) Create(ctx context.Context, phrase *models.Phrase) error {
	query := `
		INSERT INTO phrases (id, user_id, content, source, context, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	now := time.Now()
	phrase.CreatedAt = now
	phrase.UpdatedAt = now

	_, err := r.db.Exec(ctx, query,
		phrase.ID,
		phrase.UserID,
		phrase.Content,
		phrase.Source,
		phrase.Context,
		phrase.CreatedAt,
		phrase.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create phrase: %w", err)
	}
	return nil
}


func (r *PhraseRepository) GetByID(ctx context.Context, id string) (*models.Phrase, error) {
	query := `
		SELECT id, user_id, content, source, context, created_at, updated_at
		FROM phrases
		WHERE id = $1
	`
	var phrase models.Phrase
	err := r.db.QueryRow(ctx, query, id).Scan(
		&phrase.ID,
		&phrase.UserID,
		&phrase.Content,
		&phrase.Source,
		&phrase.Context,
		&phrase.CreatedAt,
		&phrase.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get phrase: %w", err)
	}
	return &phrase, nil
}


func (r *PhraseRepository) GetByUserID(ctx context.Context, userID string) ([]models.Phrase, error) {
	query := `
		SELECT id, user_id, content, source, context, created_at, updated_at
		FROM phrases
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get phrases: %w", err)
	}
	defer rows.Close()

	var phrases []models.Phrase
	for rows.Next() {
		var phrase models.Phrase
		err := rows.Scan(
			&phrase.ID,
			&phrase.UserID,
			&phrase.Content,
			&phrase.Source,
			&phrase.Context,
			&phrase.CreatedAt,
			&phrase.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan phrase: %w", err)
		}
		phrases = append(phrases, phrase)
	}
	return phrases, nil
}


func (r *PhraseRepository) GetAll(ctx context.Context) ([]models.Phrase, error) {
	query := `
		SELECT id, user_id, content, source, context, created_at, updated_at
		FROM phrases
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get phrases: %w", err)
	}
	defer rows.Close()

	var phrases []models.Phrase
	for rows.Next() {
		var phrase models.Phrase
		err := rows.Scan(
			&phrase.ID,
			&phrase.UserID,
			&phrase.Content,
			&phrase.Source,
			&phrase.Context,
			&phrase.CreatedAt,
			&phrase.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan phrase: %w", err)
		}
		phrases = append(phrases, phrase)
	}
	return phrases, nil
}


func (r *PhraseRepository) Update(ctx context.Context, phrase *models.Phrase) error {
	query := `
		UPDATE phrases
		SET content = $1, source = $2, context = $3, updated_at = $4
		WHERE id = $5
	`
	phrase.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		phrase.Content,
		phrase.Source,
		phrase.Context,
		phrase.UpdatedAt,
		phrase.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update phrase: %w", err)
	}
	return nil
}


func (r *PhraseRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM phrases WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete phrase: %w", err)
	}
	return nil
}


type UserRepository struct {
	db *pgxpool.Pool
}
func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}


func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, username, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now

	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		user.CreatedAt,
		user.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}


func (r *UserRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	query := `
		SELECT id, email, username, created_at, updated_at
		FROM users
		WHERE id = $1
	`
	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}


func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, username, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}


func (r *UserRepository) GetAll(ctx context.Context) ([]models.User, error) {
	query := `
		SELECT id, email, username, created_at, updated_at
		FROM users
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Username,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}


func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET email = $1, username = $2, updated_at = $3
		WHERE id = $4
	`
	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		user.Email,
		user.Username,
		user.UpdatedAt,
		user.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}


func (r *UserRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}
