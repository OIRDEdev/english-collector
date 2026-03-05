#!/usr/bin/env bash
# ============================================================================
# db_select.sh — Executa consultas SELECT no banco Neon PostgreSQL
# SEGURANÇA: Rejeita qualquer operação que não seja SELECT puro.
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

# --- Validar argumentos ---
if [[ $# -lt 1 ]]; then
    echo "📖 Uso: bash $0 \"<query SQL SELECT>\""
    echo ""
    echo "Exemplos:"
    echo "  bash $0 \"SELECT * FROM usuarios LIMIT 10\""
    echo "  bash $0 \"SELECT COUNT(*) FROM exercicios\""
    exit 1
fi

QUERY="$1"

# --- Sanitizar: converter para maiúscula para validação ---
QUERY_UPPER=$(echo "$QUERY" | tr '[:lower:]' '[:upper:]' | xargs)

# --- Validar que é um SELECT ---
if [[ ! "$QUERY_UPPER" =~ ^[[:space:]]*SELECT ]]; then
    echo "❌ Erro: Apenas consultas SELECT são permitidas."
    echo "   Query recebida: $QUERY"
    exit 1
fi

# --- Bloquear operações perigosas (mesmo em subqueries/CTEs) ---
BLOCKED_KEYWORDS=("DELETE" "DROP" "TRUNCATE" "ALTER" "INSERT" "UPDATE" "CREATE" "GRANT" "REVOKE" "EXECUTE" "CALL")
for keyword in "${BLOCKED_KEYWORDS[@]}"; do
    # Busca a palavra como token isolado (word boundary)
    if echo "$QUERY_UPPER" | grep -qP "(?<![A-Z_])${keyword}(?![A-Z_])"; then
        echo "❌ Erro: Operação '$keyword' não é permitida neste script."
        echo "   Este script aceita apenas consultas SELECT puras."
        exit 1
    fi
done

# --- Executar a query ---
echo "🔍 Executando SELECT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

psql "$DATABASE_URL" -c "$QUERY" --pset="border=2" --pset="format=wrapped" 2>&1

EXIT_CODE=$?

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
    echo "✅ Query executada com sucesso."
else
    echo "❌ Erro ao executar a query (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE
