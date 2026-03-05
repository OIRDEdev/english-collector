import os
import json
import time
import google.generativeai as genai

# Configuração da API
# Substitua pela sua chave real ou configure a variável de ambiente
GEMINI_API_KEY = ""
try:
    with open("../backend/.env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("API_KEY_GEMINI=="):
                url_env = line.strip().split("=", 1)[1]
                # remove possíveis aspas
                if url_env.startswith('"') and url_env.endswith('"'):
                    url_env = url_env[1:-1]
                GEMINI_API_KEY = url_env
                break
except Exception:
    pass
genai.configure(api_key=GEMINI_API_KEY)

def clean_json_response(text):
    """Remove marcações de markdown e limpa a string para conversão JSON."""
    text = text.strip()
    if text.startswith("```"):
        # Remove ```json ou ``` no início e ``` no fim
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text

def get_exercises_for_language(language):
    """Solicita os 4 modelos de exercícios para um idioma específico."""
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = f"""
    Você é uma API de geração de exercícios. Responda APENAS com um array JSON.
    Para o idioma/tecnologia "{language}", gere exatamente 4 exercícios, um de cada modelo abaixo:

    Modelo 1 (Lógica): {{"texto": "...", "instrucao": "Ache a falha lógica", "palavra_alvo": "..."}}
    Modelo 2 (Sinônimo): {{"opcoes": [{{ "texto": "...", "correta": true }}, ...], "instrucao": "Arraste para o sinônimo correto", "palavra_central": "..."}}
    Modelo 3 (Ruído): {{"instrucao": "Remova o ruído da frase", "tempo_leitura": 60, "texto_completo": "...", "palavras_erradas": ["..."]}}
    Modelo 4 (Técnico): {{"tags": ["...", "..."], "resposta": "...", "descricao": "...", "instrucao": "Forme a palavra:", "distratores": "..."}}

    Gere o conteúdo em nível intermediário para {language}. Não use blocos de código markdown.
    """

    try:
        response = model.generate_content(prompt)
        cleaned_text = clean_json_response(response.text)
        return json.loads(cleaned_text)
    except Exception as e:
        print(f"Erro ao processar {language}: {e}")
        return []

def main():
    # Lista de línguas/tecnologias que você deseja
    languages = ["English", "coreano", "japones", "Spanish", "frances", "italiano"]
    all_exercises = {}

    for lang in languages:
        print(f"Solicitando exercícios para: {lang}...")
        exercises = get_exercises_for_language(lang)
        all_exercises[lang] = exercises
        # Pequena pausa para evitar limite de requisições (Rate Limit)
        time.sleep(1)

    # Salva o resultado final no arquivo exercicios.json
    with open("exercicios.json", "w", encoding="utf-8") as f:
        json.dump(all_exercises, f, indent=4, ensure_ascii=False)
    
    print("\n✅ Sucesso! Os exercícios foram salvos em 'exercicios.json'.")
    
    # Chama o script para adicionar no banco de dados
    print("\nIniciando a inserção dos exercícios no banco de dados...")
    import subprocess
    subprocess.run(["python3", "addexercises.py"])

if __name__ == "__main__":
    main()