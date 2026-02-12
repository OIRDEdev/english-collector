package repository

import (
	"context"
	"encoding/json"
	"time"

	"extension-backend/internal/anki"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func New(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetDueCards busca cards que precisam ser revisados (proxima_revisao <= agora)
func (r *Repository) GetDueCards(ctx context.Context, userID int) ([]anki.AnkiCard, error) {
	query := `
		SELECT 
			ap.id, ap.frase_id, f.conteudo,
			COALESCE(fd.traducao_completa, '') as traducao_completa,
			fd.fatias_traducoes,
			ap.facilidade, ap.intervalo, ap.repeticoes, ap.sequencia_acertos,
			ap.estado, ap.proxima_revisao
		FROM anki_progresso ap
		JOIN frases f ON ap.frase_id = f.id
		LEFT JOIN frase_detalhes fd ON f.id = fd.frase_id
		WHERE ap.usuario_id = $1 
		  AND ap.proxima_revisao <= CURRENT_TIMESTAMP
		  AND ap.estado != 'suspenso'
		ORDER BY ap.proxima_revisao ASC
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []anki.AnkiCard
	for rows.Next() {
		var card anki.AnkiCard
		var fatiasJSON []byte

		err := rows.Scan(
			&card.ID, &card.FraseID, &card.Conteudo,
			&card.TraducaoCompleta,
			&fatiasJSON,
			&card.Facilidade, &card.Intervalo, &card.Repeticoes, &card.SequenciaAcertos,
			&card.Estado, &card.ProximaRevisao,
		)
		if err != nil {
			return nil, err
		}

		if fatiasJSON != nil {
			json.Unmarshal(fatiasJSON, &card.FatiasTraducoes)
		}

		cards = append(cards, card)
	}

	return cards, rows.Err()
}

// GetByID busca um card específico pelo ID do anki_progresso
func (r *Repository) GetByID(ctx context.Context, id int) (*anki.AnkiCard, error) {
	query := `
		SELECT 
			ap.id, ap.frase_id, f.conteudo,
			COALESCE(fd.traducao_completa, '') as traducao_completa,
			fd.fatias_traducoes,
			ap.facilidade, ap.intervalo, ap.repeticoes, ap.sequencia_acertos,
			ap.estado, ap.proxima_revisao
		FROM anki_progresso ap
		JOIN frases f ON ap.frase_id = f.id
		LEFT JOIN frase_detalhes fd ON f.id = fd.frase_id
		WHERE ap.id = $1
	`

	var card anki.AnkiCard
	var fatiasJSON []byte

	err := r.db.QueryRow(ctx, query, id).Scan(
		&card.ID, &card.FraseID, &card.Conteudo,
		&card.TraducaoCompleta,
		&fatiasJSON,
		&card.Facilidade, &card.Intervalo, &card.Repeticoes, &card.SequenciaAcertos,
		&card.Estado, &card.ProximaRevisao,
	)
	if err != nil {
		return nil, err
	}

	if fatiasJSON != nil {
		json.Unmarshal(fatiasJSON, &card.FatiasTraducoes)
	}

	return &card, nil
}

// UpdateProgress atualiza o progresso SRS de um card
func (r *Repository) UpdateProgress(ctx context.Context, id int, facilidade float64, intervalo int, repeticoes int, sequencia int, estado string, proxRevisao time.Time) error {
	query := `
		UPDATE anki_progresso 
		SET facilidade = $2, intervalo = $3, repeticoes = $4, 
			sequencia_acertos = $5, estado = $6, proxima_revisao = $7,
			ultima_revisao = CURRENT_TIMESTAMP
		WHERE id = $1
	`
	_, err := r.db.Exec(ctx, query, id, facilidade, intervalo, repeticoes, sequencia, estado, proxRevisao)
	return err
}

// InsertHistory registra uma revisão no histórico
func (r *Repository) InsertHistory(ctx context.Context, ankiID, userID, nota, intervaloAnterior, novoIntervalo int) error {
	query := `
		INSERT INTO anki_historico (anki_id, usuario_id, nota, intervalo_anterior, novo_intervalo)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.db.Exec(ctx, query, ankiID, userID, nota, intervaloAnterior, novoIntervalo)
	return err
}

// GetStats retorna estatísticas da sessão do usuário
func (r *Repository) GetStats(ctx context.Context, userID int) (*anki.SessionStats, error) {
	query := `
		SELECT 
			COUNT(*) as total_cards,
			COUNT(*) FILTER (WHERE proxima_revisao <= CURRENT_TIMESTAMP AND estado != 'suspenso') as due_today,
			COUNT(*) FILTER (WHERE estado = 'novo') as novos,
			COUNT(*) FILTER (WHERE estado = 'aprendizado') as aprendendo,
			COUNT(*) FILTER (WHERE estado = 'revisao') as revisao
		FROM anki_progresso 
		WHERE usuario_id = $1
	`

	var stats anki.SessionStats
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&stats.TotalCards,
		&stats.DueToday,
		&stats.Novos,
		&stats.Aprendendo,
		&stats.Revisao,
	)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
