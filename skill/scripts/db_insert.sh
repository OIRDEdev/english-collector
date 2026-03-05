#!/usr/bin/env bash
# ============================================================================
# db_insert.sh — Inserir dados no banco Neon PostgreSQL
# SEGURANÇA: Aceita APENAS queries INSERT. Rejeita qualquer outra operação.
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
RETURNING=false
QUERY=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --returning)
            RETURNING=true
            shift
            ;;
        --help|-h)
            echo "📖 Uso: bash $0 \"<query INSERT>\" [--returning]"
            echo ""
            echo "Exemplos:"
            echo "  bash $0 \"INSERT INTO usuarios (nome, email) VALUES ('João', 'joao@email.com')\""
            echo "  bash $0 \"INSERT INTO exercicios (titulo) VALUES ('Verbo To Be')\" --returning"
            echo ""
            echo "Flags:"
            echo "  --returning   Adiciona RETURNING * à query para ver o registro inserido."
            exit 0
            ;;
        *)
            QUERY="$1"
            shift
            ;;
    esac
done

# --- Validar argumentos ---
if [[ -z "$QUERY" ]]; then
    echo "❌ Erro: Nenhuma query fornecida."
    echo "📖 Uso: bash $0 \"<query INSERT>\" [--returning]"
    exit 1
fi

# --- Sanitizar: converter para maiúscula para validação ---
QUERY_UPPER=$(echo "$QUERY" | tr '[:lower:]' '[:upper:]' | xargs)

# --- Validar que é um INSERT ---
if [[ ! "$QUERY_UPPER" =~ ^[[:space:]]*INSERT ]]; then
    echo "❌ Erro: Apenas queries INSERT são permitidas."
    echo "   Query recebida: $QUERY"
    exit 1
fi

# --- Bloquear operações perigosas ---
BLOCKED_KEYWORDS=("DELETE" "DROP" "TRUNCATE" "ALTER" "UPDATE" "CREATE" "GRANT" "REVOKE" "EXECUTE" "CALL")
for keyword in "${BLOCKED_KEYWORDS[@]}"; do
    if echo "$QUERY_UPPER" | grep -qP "(?<![A-Z_])${keyword}(?![A-Z_])"; then
        echo "❌ Erro: Operação '$keyword' não é permitida neste script."
        echo "   Este script aceita apenas queries INSERT."
        exit 1
    fi
done

# --- Adicionar RETURNING * se solicitado ---
FINAL_QUERY="$QUERY"
if [[ "$RETURNING" == true ]]; then
    # Remover ; final se existir
    FINAL_QUERY=$(echo "$FINAL_QUERY" | sed 's/;[[:space:]]*$//')
    FINAL_QUERY="$FINAL_QUERY RETURNING *"
fi

# --- Executar a query ---
echo "📥 Executando INSERT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

psql "$DATABASE_URL" -c "$FINAL_QUERY" --pset="border=2" 2>&1

EXIT_CODE=$?

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ Dados inseridos com sucesso."
else
    echo "❌ Erro ao inserir dados (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE
