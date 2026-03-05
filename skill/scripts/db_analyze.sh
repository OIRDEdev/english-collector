#!/usr/bin/env bash
# ============================================================================
# db_analyze.sh — Análise do estado do banco Neon PostgreSQL
# Ferramentas de diagnóstico: tamanho, contagem, estatísticas, índices, conexões.
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
SHOW_SIZE=false
SHOW_COUNT=false
SHOW_STATS=false
SHOW_INDEXES=false
SHOW_CONNECTIONS=false
SHOW_ALL=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --size)
            SHOW_SIZE=true; SHOW_ALL=false; shift ;;
        --count)
            SHOW_COUNT=true; SHOW_ALL=false; shift ;;
        --stats)
            SHOW_STATS=true; SHOW_ALL=false; shift ;;
        --indexes)
            SHOW_INDEXES=true; SHOW_ALL=false; shift ;;
        --connections)
            SHOW_CONNECTIONS=true; SHOW_ALL=false; shift ;;
        --help|-h)
            echo "📖 Uso: bash $0 [--size] [--count] [--stats] [--indexes] [--connections]"
            echo ""
            echo "Sem argumentos: análise completa."
            echo "  --size         Tamanho do banco e tabelas"
            echo "  --count        Contagem de registros por tabela"
            echo "  --stats        Estatísticas de uso (cache hit ratio, etc)"
            echo "  --indexes      Análise de índices (não utilizados, redundantes)"
            echo "  --connections  Conexões ativas"
            exit 0
            ;;
        *)
            echo "❌ Argumento desconhecido: $1"
            exit 1
            ;;
    esac
done

echo "🔬 Análise do Banco de Dados Neon PostgreSQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# TAMANHO DO BANCO E TABELAS
# ============================================================================
if [[ "$SHOW_ALL" == true || "$SHOW_SIZE" == true ]]; then
    echo "📏 TAMANHO DO BANCO DE DADOS"
    echo "──────────────────────────────────────────────────"

    psql "$DATABASE_URL" -c "
        SELECT
            pg_database.datname AS banco,
            pg_size_pretty(pg_database_size(pg_database.datname)) AS tamanho_total
        FROM pg_database
        WHERE pg_database.datname = current_database();
    " --pset="border=2" 2>&1

    echo ""
    echo "📏 TAMANHO POR TABELA"
    echo "──────────────────────────────────────────────────"

    psql "$DATABASE_URL" -c "
        SELECT
            schemaname || '.' || relname AS tabela,
            pg_size_pretty(pg_total_relation_size(relid)) AS tamanho_total,
            pg_size_pretty(pg_relation_size(relid)) AS tamanho_dados,
            pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS tamanho_indices
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC;
    " --pset="border=2" 2>&1

    echo ""
fi

# ============================================================================
# CONTAGEM DE REGISTROS
# ============================================================================
if [[ "$SHOW_ALL" == true || "$SHOW_COUNT" == true ]]; then
    echo "🔢 CONTAGEM DE REGISTROS POR TABELA"
    echo "──────────────────────────────────────────────────"

    psql "$DATABASE_URL" -c "
        SELECT
            schemaname AS schema,
            relname AS tabela,
            n_live_tup AS registros_estimados,
            n_dead_tup AS registros_mortos,
            last_vacuum AS ultimo_vacuum,
            last_autovacuum AS ultimo_autovacuum,
            last_analyze AS ultimo_analyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
    " --pset="border=2" 2>&1

    echo ""
    echo "📊 CONTAGEM EXATA (pode ser lento em tabelas grandes)"
    echo "──────────────────────────────────────────────────"

    # Gerar e executar contagem exata para cada tabela
    TABLES=$(psql "$DATABASE_URL" -t -c "
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    " 2>/dev/null)

    COUNT_QUERY=""
    FIRST=true
    while IFS= read -r table; do
        table=$(echo "$table" | xargs)
        [[ -z "$table" ]] && continue
        if [[ "$FIRST" == true ]]; then
            COUNT_QUERY="SELECT '$table' AS tabela, COUNT(*) AS total FROM $table"
            FIRST=false
        else
            COUNT_QUERY="$COUNT_QUERY UNION ALL SELECT '$table', COUNT(*) FROM $table"
        fi
    done <<< "$TABLES"

    if [[ -n "$COUNT_QUERY" ]]; then
        COUNT_QUERY="$COUNT_QUERY ORDER BY total DESC"
        psql "$DATABASE_URL" -c "$COUNT_QUERY" --pset="border=2" 2>&1
    fi

    echo ""
fi

# ============================================================================
# ESTATÍSTICAS DE USO
# ============================================================================
if [[ "$SHOW_ALL" == true || "$SHOW_STATS" == true ]]; then
    echo "📈 ESTATÍSTICAS DE USO"
    echo "──────────────────────────────────────────────────"

    echo ""
    echo "🎯 Cache Hit Ratio (ideal > 99%)"
    psql "$DATABASE_URL" -c "
        SELECT
            sum(heap_blks_read) AS blocos_lidos_disco,
            sum(heap_blks_hit) AS blocos_do_cache,
            CASE
                WHEN sum(heap_blks_hit) + sum(heap_blks_read) = 0 THEN 'N/A'
                ELSE round(sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2) || '%'
            END AS cache_hit_ratio
        FROM pg_statio_user_tables;
    " --pset="border=2" 2>&1

    echo ""
    echo "🎯 Index Cache Hit Ratio"
    psql "$DATABASE_URL" -c "
        SELECT
            sum(idx_blks_read) AS blocos_indice_disco,
            sum(idx_blks_hit) AS blocos_indice_cache,
            CASE
                WHEN sum(idx_blks_hit) + sum(idx_blks_read) = 0 THEN 'N/A'
                ELSE round(sum(idx_blks_hit)::numeric / (sum(idx_blks_hit) + sum(idx_blks_read)) * 100, 2) || '%'
            END AS index_cache_hit_ratio
        FROM pg_statio_user_indexes;
    " --pset="border=2" 2>&1

    echo ""
    echo "📊 Atividade por Tabela (seq scan vs index scan)"
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname || '.' || relname AS tabela,
            seq_scan AS scans_sequenciais,
            idx_scan AS scans_por_indice,
            CASE
                WHEN seq_scan + COALESCE(idx_scan, 0) = 0 THEN 'N/A'
                ELSE round(COALESCE(idx_scan, 0)::numeric / (seq_scan + COALESCE(idx_scan, 0)) * 100, 2) || '%'
            END AS porcentagem_uso_indice,
            n_tup_ins AS inserts,
            n_tup_upd AS updates,
            n_tup_del AS deletes
        FROM pg_stat_user_tables
        ORDER BY seq_scan DESC;
    " --pset="border=2" 2>&1

    echo ""
fi

# ============================================================================
# ANÁLISE DE ÍNDICES
# ============================================================================
if [[ "$SHOW_ALL" == true || "$SHOW_INDEXES" == true ]]; then
    echo "🔍 ANÁLISE DE ÍNDICES"
    echo "──────────────────────────────────────────────────"

    echo ""
    echo "⚠️  Índices Não Utilizados (idx_scan = 0)"
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname || '.' || relname AS tabela,
            indexrelname AS indice,
            pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho_indice,
            idx_scan AS vezes_usado
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
          AND indexrelname NOT LIKE '%_pkey'
        ORDER BY pg_relation_size(indexrelid) DESC;
    " --pset="border=2" 2>&1

    echo ""
    echo "📋 Todos os Índices"
    psql "$DATABASE_URL" -c "
        SELECT
            schemaname || '.' || relname AS tabela,
            indexrelname AS indice,
            pg_size_pretty(pg_relation_size(indexrelid)) AS tamanho,
            idx_scan AS scans,
            idx_tup_read AS tuplas_lidas,
            idx_tup_fetch AS tuplas_buscadas
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC;
    " --pset="border=2" 2>&1

    echo ""
    echo "⚠️  Tabelas com Foreign Keys sem Índice"
    psql "$DATABASE_URL" -c "
        SELECT
            tc.table_name AS tabela,
            kcu.column_name AS coluna_fk,
            ccu.table_name AS tabela_referenciada,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM pg_indexes pi
                    WHERE pi.tablename = tc.table_name
                      AND pi.indexdef LIKE '%' || kcu.column_name || '%'
                ) THEN '✅ Sim'
                ELSE '❌ Não'
            END AS tem_indice
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name;
    " --pset="border=2" 2>&1

    echo ""
fi

# ============================================================================
# CONEXÕES ATIVAS
# ============================================================================
if [[ "$SHOW_ALL" == true || "$SHOW_CONNECTIONS" == true ]]; then
    echo "🔌 CONEXÕES ATIVAS"
    echo "──────────────────────────────────────────────────"

    psql "$DATABASE_URL" -c "
        SELECT
            pid,
            usename AS usuario,
            application_name AS aplicacao,
            client_addr AS ip_cliente,
            state AS estado,
            query_start AS inicio_query,
            NOW() - query_start AS duracao,
            LEFT(query, 80) AS query_resumida
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
        ORDER BY query_start DESC NULLS LAST;
    " --pset="border=2" 2>&1

    echo ""
    echo "📊 Resumo de Conexões"
    psql "$DATABASE_URL" -c "
        SELECT
            state AS estado,
            COUNT(*) AS total
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY total DESC;
    " --pset="border=2" 2>&1

    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Análise concluída."
