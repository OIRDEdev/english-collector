package database

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func Connect() (*pgxpool.Pool, error) {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, err
	}
	
	// Neon recommended settings
	config.MaxConns = 10
	config.MinConns = 1
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	pool, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}
	
	if err := pool.Ping(ctx); err != nil {
		return nil, err
	}
	//dados := inicializarBancoDeDados(pool)
	//log.Printf("dados: %v", dados)
	log.Println("Connected to Neon PostgreSQL")
	return pool, nil
}

func Close() {
	if pool != nil {
		pool.Close()
		log.Println("Database connection closed")
	}
}

func GetPool() *pgxpool.Pool {
	return pool
}
/*
func inicializarBancoDeDados(pool *pgxpool.Pool) error {
	log.Println("Lendo arquivo de migration")
	sqlBytes, err := os.ReadFile("/home/edrio/Downloads/projetos/extension-proj/backend/migrations/exempla.sql")
	log.Printf("err: %v", err)
	if err != nil {
		return err
	}
	log.Println("Iniciando banco de dados")
	sql := string(sqlBytes)
	_, err = pool.Exec(context.Background(), sql)
	if err != nil {
		return err
	}
	log.Println("Banco de dados inicializado com sucesso")
	return nil
}
*/