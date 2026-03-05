#!/usr/bin/env bash
# ============================================================================
# db_tables.sh — Visualizar tabelas e estrutura do banco Neon PostgreSQL
# Mostra tabelas, colunas, tipos, constraints, foreign keys e índices.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/backend/.env"

# --- Carregar DATABASE_URL do .env ---
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Erro: Arquivo .env não encontrado em $ENV_FILE"
    exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/^DATABASE_URL=//' | tr -d '"' | tr -d "'")

if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ Erro: DATABASE_URL não definida no .env"
    exit 1
fi

# --- Parsear argumentos ---
TABLE_NAME=""
SHOW_FK=false
SHOW_INDEXES=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --fk)
            SHOW_FK=true
            shift
            ;;
        --indexes)
            SHOW_INDEXES=true
            shift
            ;;
        --help|-h)
            echo "📖 Uso: bash $0 [nome_tabela] [--fk] [--indexes]"
            echo ""
            echo "Sem argumentos: lista todas as tabelas."
            echo "Com nome:       mostra estrutura da tabela."
            echo "  --fk         mostra foreign keys da tabela."
            echo "  --indexes    mostra índices da tabela."
            exit 0
            ;;
        *)
            TABLE_NAME="$1"
            shift
            ;;
    esac
done

# --- Sem tabela específica: listar todas ---
if [[ -z "$TABLE_NAME" ]]; then
    echo "📋 Tabelas no banco de dados"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    psql "$DATABASE_URL" -c "
        SELECT
            schemaname AS schema,
            tablename AS tabela,
            tableowner AS dono
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
    " --pset="border=2" 2>&1

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "💡 Dica: Use 'bash $0 <nome_tabela>' para ver a estrutura de uma tabela."
    exit 0
fi

# --- Mostrar estrutura da tabela ---
echo "📋 Estrutura da tabela: $TABLE_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colunas, tipos, nullable, default
psql "$DATABASE_URL" -c "
    SELECT
        c.column_name AS coluna,
        c.data_type AS tipo,
        c.character_maximum_length AS tamanho_max,
        c.is_nullable AS nulo,
        c.column_default AS valor_padrao
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = '$TABLE_NAME'
    ORDER BY c.ordinal_position;
" --pset="border=2" 2>&1

echo ""

# Constraints (PK, UNIQUE, CHECK)
echo "🔑 Constraints"
echo "──────────────────────────────────────────────────"
psql "$DATABASE_URL" -c "
    SELECT
        tc.constraint_name AS constraint,
        tc.constraint_type AS tipo,
        string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS colunas
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = '$TABLE_NAME'
    GROUP BY tc.constraint_name, tc.constraint_type
    ORDER BY tc.constraint_type;
" --pset="border=2" 2>&1

# --- Foreign Keys ---
if [[ "$SHOW_FK" == true ]]; then
    echo ""
    echo "🔗 Foreign Keys"
    echo "──────────────────────────────────────────────────"
    psql "$DATABASE_URL" -c "
        SELECT
            tc.constraint_name AS fk_nome,
            kcu.column_name AS coluna_local,
            ccu.table_name AS tabela_referenciada,
            ccu.column_name AS coluna_referenciada
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
            AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = '$TABLE_NAME'
          AND tc.constraint_type = 'FOREIGN KEY'
        ORDER BY kcu.column_name;
    " --pset="border=2" 2>&1
fi

# --- Índices ---
if [[ "$SHOW_INDEXES" == true ]]; then
    echo ""
    echo "📊 Índices"
    echo "──────────────────────────────────────────────────"
    psql "$DATABASE_URL" -c "
        SELECT
            indexname AS indice,
            indexdef AS definicao
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = '$TABLE_NAME'
        ORDER BY indexname;
    " --pset="border=2" 2>&1
fi

echo ""
echo "✅ Estrutura da tabela '$TABLE_NAME' exibida com sucesso."
