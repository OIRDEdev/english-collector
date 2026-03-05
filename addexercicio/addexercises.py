import json
import os
import psycopg2
from datetime import datetime

# URL de conexão no arquivo backend/.env
DATABASE_URL = ""
try:
    with open("../backend/.env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                url_env = line.strip().split("=", 1)[1]
                # remove possíveis aspas
                if url_env.startswith('"') and url_env.endswith('"'):
                    url_env = url_env[1:-1]
                DATABASE_URL = url_env
                break
except Exception:
    pass

# Mapeamento do idioma que vem do JSON para o ID da tabela 'idiomas'
IDIOMA_MAP = {
    "English": 1,
    "Spanish": 4,      # Espanhol
    "frances": 5,      # Francês
    "japones": 13,     # Japonês
    "coreano": 19,     # Coreano
    "italiano": None   # Italiano não está mapeado previamente nos 20 iniciais
}

IDIOMA_ID_ORIGEM_DEFAULT = 7 # 7 corresponde a Português

def main():
    json_path = "exercicios.json"
    if not os.path.exists(json_path):
        print(f"❌ {json_path} não encontrado.")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            exercicios_por_idioma = json.load(f)
    except Exception as e:
        print(f"❌ Erro ao ler json: {e}")
        return

    print("🔌 Conectando ao Neon PostgreSQL...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Erro ao conectar ao banco de dados: {e}")
        return

    total_inseridos = 0
    criado_em = datetime.now()

    try:
        for idioma_nome, lista_exercicios in exercicios_por_idioma.items():
            idioma_id = IDIOMA_MAP.get(idioma_nome)
            
            for exercicio in lista_exercicios:
                # 2 usuario_id (deixe como null)
                usuario_id = None
                
                # 3 dados_exercicio (o json do exercicio)
                dados_exercicio = json.dumps(exercicio, ensure_ascii=False)
                
                # 4 nivel (Pode ser int, 2 para intermediário, ou NULL que o banco aceita)
                nivel = 2 
                
                # 6 catalogo_id
                catalogo_id = None
                if "palavra_alvo" in exercicio:
                    catalogo_id = 4 # LogicBreaker
                elif "palavra_central" in exercicio:
                    catalogo_id = 5 # NexusConnect
                elif "palavras_erradas" in exercicio:
                    catalogo_id = 2 # ClaritySprint
                elif "distratores" in exercicio:
                    catalogo_id = 7 # key
                
                id_origem = IDIOMA_ID_ORIGEM_DEFAULT
                
                cur.execute('''
                    INSERT INTO exercicios (
                        usuario_id, dados_exercicio, nivel, criado_em, 
                        catalogo_id, idioma_id, idioma_id_origem
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (
                    usuario_id,
                    dados_exercicio,
                    nivel,
                    criado_em,
                    catalogo_id,
                    idioma_id,
                    id_origem
                ))
                total_inseridos += 1
                
        conn.commit()
        print(f"✅ Sucesso! {total_inseridos} exercícios foram inseridos na tabela 'exercicios'.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Erro ao inserir dados: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()