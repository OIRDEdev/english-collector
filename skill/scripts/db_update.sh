#!/usr/bin/env bash
# ============================================================================
# db_update.sh — Alterar dados no banco Neon PostgreSQL COM VERIFICAÇÃO PRÉVIA
# SEGURANÇA: Executa em duas fases obrigatórias:
#   1. Preview (sem --confirm): mostra registros que serão afetados
#   2. Execução (com --confirm): aplica o UPDATE de fato
# NUNCA apaga dados. NUNCA executa sem verificação.
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
CONFIRM=false
TABLE=""
WHERE_CLAUSE=""
SET_CLAUSE=""

POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --confirm)
            CONFIRM=true
            shift
            ;;
        --help|-h)
            echo "📖 Uso: bash $0 <tabela> <where_clause> <set_clause> [--confirm]"
            echo ""
            echo "Fase 1 — Preview (sem --confirm):"
            echo "  bash $0 \"usuarios\" \"id = 5\" \"nome = 'Novo Nome'\""
            echo "  → Mostra os registros que serão afetados."
            echo ""
            echo "Fase 2 — Execução (com --confirm):"
            echo "  bash $0 \"usuarios\" \"id = 5\" \"nome = 'Novo Nome'\" --confirm"
            echo "  → Aplica o UPDATE de fato."
            echo ""
            echo "⚠️  SEMPRE execute primeiro sem --confirm para verificar!"
            exit 0
            ;;
        *)
            POSITIONAL_ARGS+=("$1")
            shift
            ;;
    esac
done

# --- Validar argumentos posicionais ---
if [[ ${#POSITIONAL_ARGS[@]} -lt 3 ]]; then
    echo "❌ Erro: Argumentos insuficientes."
    echo ""
    echo "📖 Uso: bash $0 <tabela> <where_clause> <set_clause> [--confirm]"
    echo ""
    echo "Argumentos:"
    echo "  tabela        Nome da tabela (ex: 'usuarios')"
    echo "  where_clause  Condição WHERE, SEM a palavra WHERE (ex: 'id = 5')"
    echo "  set_clause    Valores SET, SEM a palavra SET (ex: \"nome = 'Novo'\")"
    exit 1
fi

TABLE="${POSITIONAL_ARGS[0]}"
WHERE_CLAUSE="${POSITIONAL_ARGS[1]}"
SET_CLAUSE="${POSITIONAL_ARGS[2]}"

# --- Validar contra operações perigosas nos argumentos ---
ALL_INPUT="$TABLE $WHERE_CLAUSE $SET_CLAUSE"
ALL_INPUT_UPPER=$(echo "$ALL_INPUT" | tr '[:lower:]' '[:upper:]')

BLOCKED_KEYWORDS=("DELETE" "DROP" "TRUNCATE" "ALTER" "CREATE" "GRANT" "REVOKE" "EXECUTE" "CALL")
for keyword in "${BLOCKED_KEYWORDS[@]}"; do
    if echo "$ALL_INPUT_UPPER" | grep -qP "(?<![A-Z_])${keyword}(?![A-Z_])"; then
        echo "❌ Erro: Operação '$keyword' detectada nos argumentos. Operação bloqueada."
        exit 1
    fi
done

# --- Validar table name (só alfanuméricos e underscore) ---
if [[ ! "$TABLE" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "❌ Erro: Nome de tabela inválido: '$TABLE'"
    echo "   Use apenas letras, números e underscores."
    exit 1
fi

# ============================================================================
# FASE 1: PREVIEW — Mostrar registros que serão afetados
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ "$CONFIRM" == false ]]; then
    echo "👁️  PREVIEW — Registros que serão afetados pelo UPDATE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Tabela:  $TABLE"
    echo "🔍 WHERE:   $WHERE_CLAUSE"
    echo "✏️  SET:     $SET_CLAUSE"
    echo ""
    echo "── Registros atuais (antes do UPDATE) ──────────"
    echo ""

    PREVIEW_QUERY="SELECT * FROM $TABLE WHERE $WHERE_CLAUSE"
    psql "$DATABASE_URL" -c "$PREVIEW_QUERY" --pset="border=2" 2>&1

    RESULT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $TABLE WHERE $WHERE_CLAUSE" 2>/dev/null | xargs)

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Total de registros que serão afetados: $RESULT_COUNT"
    echo ""
    echo "⚠️  Para executar o UPDATE, rode novamente com --confirm:"
    echo "   bash $0 \"$TABLE\" \"$WHERE_CLAUSE\" \"$SET_CLAUSE\" --confirm"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
fi

# ============================================================================
# FASE 2: EXECUÇÃO — Aplicar o UPDATE
# ============================================================================

echo "✏️  EXECUÇÃO — Aplicando UPDATE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Tabela:  $TABLE"
echo "🔍 WHERE:   $WHERE_CLAUSE"
echo "✏️  SET:     $SET_CLAUSE"
echo ""

# Primeiro, mostrar preview novamente para log
echo "── Estado ANTES do UPDATE ──────────────────────────"
psql "$DATABASE_URL" -c "SELECT * FROM $TABLE WHERE $WHERE_CLAUSE" --pset="border=2" 2>&1
echo ""

# Executar o UPDATE
UPDATE_QUERY="UPDATE $TABLE SET $SET_CLAUSE WHERE $WHERE_CLAUSE"
echo "── Executando UPDATE ───────────────────────────────"
psql "$DATABASE_URL" -c "$UPDATE_QUERY" 2>&1

EXIT_CODE=$?

if [[ $EXIT_CODE -eq 0 ]]; then
    echo ""
    echo "── Estado DEPOIS do UPDATE ─────────────────────────"
    psql "$DATABASE_URL" -c "SELECT * FROM $TABLE WHERE $WHERE_CLAUSE" --pset="border=2" 2>&1
    echo ""
    echo "✅ UPDATE executado com sucesso."
else
    echo ""
    echo "❌ Erro ao executar UPDATE (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE
