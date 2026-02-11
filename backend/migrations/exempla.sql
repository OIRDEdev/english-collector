
-- ==========================================
-- 1. TABELA DE USUÁRIOS
-- ==========================================
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    token_extensao VARCHAR(255) UNIQUE, -- Chave de acesso para a extensão
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para login e validação de token da extensão
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_token ON usuarios(token_extensao);


-- ==========================================
-- 2. TABELA DE FRASES (O Coração do Sistema)
-- ==========================================
CREATE TABLE frases (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    idioma_origem VARCHAR(10) DEFAULT 'en',
    url_origem TEXT,
    titulo_pagina VARCHAR(255),
    capturado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_usuario_frase FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índice para carregar rápido o dashboard do usuário
CREATE INDEX idx_frases_usuario ON frases(usuario_id);
-- Índice para buscas textuais (ajuda a achar palavras dentro das frases)
CREATE INDEX idx_frases_busca_texto ON frases USING gin(to_tsvector('simple', conteudo));


-- ==========================================
-- 3. TABELA DE TRADUÇÕES (O Cache de IA)
-- ==========================================
CREATE TABLE frase_detalhes (
    id SERIAL PRIMARY KEY,
    frase_id INTEGER NOT NULL UNIQUE, -- Um detalhe para cada frase
    traducao_completa TEXT NOT NULL,
    explicacao TEXT,
    
    -- Aqui entra o seu JSON com as fatias (slices_translations)
    -- Ex: {"no description": "sem descrição", "website": "site"}
    fatias_traducoes JSONB, 
    
    modelo_ia VARCHAR(50), -- Guardar se foi GPT-4, Gemini, etc.
    processado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_detalhe_frase FOREIGN KEY (frase_id) REFERENCES frases(id) ON DELETE CASCADE
);

-- O índice para o seu "cache" já é criado automaticamente pela constraint UNIQUE acima.
-- Se você quiser listar tudo que foi traduzido para um idioma específico:
CREATE INDEX idx_traducoes_idioma_dest ON frase_detalhes(traducao_completa);
CREATE INDEX idx_fatias_traducoes ON frase_detalhes USING GIN (fatias_traducoes);
-- ==========================================
-- 4. TABELA DE PREFERÊNCIAS DO USUÁRIO
-- ==========================================
-- Centraliza as configurações de interface e automação de IA
CREATE TABLE preferencias_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL, -- Um registro de preferência por usuário
    idioma_padrao_traducao VARCHAR(10) DEFAULT 'pt-BR',
    auto_traduzir BOOLEAN DEFAULT FALSE, -- Se TRUE, o backend traduz assim que a extensão envia
    tema_interface VARCHAR(20) DEFAULT 'dark', -- 'light', 'dark', 'system'
    
    CONSTRAINT fk_usuario_pref
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE CASCADE
);

-- ==========================================
-- 5. TABELA DE GRUPOS (Coleções/Tags Agrupadas)
-- ==========================================
CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    nome_grupo VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor_etiqueta VARCHAR(7), -- Para exibir no site (Ex: #FF5733)
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_grupo
        FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) 
        ON DELETE CASCADE
);

-- Índice para carregar os grupos do usuário rapidamente no menu lateral do site
CREATE INDEX idx_grupos_usuario ON grupos(usuario_id);

-- ==========================================
-- 6. RELAÇÃO FRASE -> GRUPO (Tabela Intermediária)
-- ==========================================
-- Criamos uma tabela de ligação para que uma frase possa pertencer a mais de um grupo
CREATE TABLE frase_grupos (
    frase_id INTEGER NOT NULL,
    grupo_id INTEGER NOT NULL,
    
    PRIMARY KEY (frase_id, grupo_id),
    CONSTRAINT fk_frase_ligacao FOREIGN KEY (frase_id) REFERENCES frases(id) ON DELETE CASCADE,
    CONSTRAINT fk_grupo_ligacao FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- ==========================================
-- 7. TABELA DE REFRESH TOKENS
-- ==========================================
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expira_em TIMESTAMP NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revogado BOOLEAN DEFAULT FALSE, -- Para deslogar o usuário remotamente se necessário
    
    CONSTRAINT fk_usuario_refresh FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices essenciais
-- 1. Busca rápida pelo token durante a renovação do Access Token
CREATE INDEX idx_refresh_token_string ON refresh_tokens(token);

-- 2. Para encontrar e invalidar todos os tokens de um usuário específico
CREATE INDEX idx_refresh_token_usuario ON refresh_tokens(usuario_id);

-- ==========================================
-- 8. TABELA DE LOGS DE IA
-- ==========================================
CREATE TABLE logs_ia (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    frase_id INTEGER NOT NULL,
    modelo_utilizado VARCHAR(50),
    tokens_prompt INTEGER, -- Quantas palavras você mandou
    tokens_completion INTEGER, -- Quantas palavras a IA respondeu
    custo_estimado DECIMAL(10, 5),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_log_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_log_frase FOREIGN KEY (frase_id) REFERENCES frases(id) ON DELETE CASCADE
);
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- 9. TABELA DE PROGRESSO SRS (ESTILO ANKI)
-- ==========================================
-- Esta tabela armazena o "estado" de aprendizado de cada frase.
CREATE TABLE anki_progresso (
    id SERIAL PRIMARY KEY,
    frase_id INTEGER NOT NULL UNIQUE,
    usuario_id INTEGER NOT NULL,
    
    -- Parâmetros do Algoritmo (Baseado em SM-2)
    facilidade DECIMAL(5,2) DEFAULT 2.50, -- Ease Factor: quão fácil é a frase
    intervalo INTEGER DEFAULT 0,           -- Intervalo atual em dias
    repeticoes INTEGER DEFAULT 0,          -- Quantas vezes foi revisada com sucesso
    sequencia_acertos INTEGER DEFAULT 0,   -- Acertos consecutivos
    
    -- Controle de Tempo
    proxima_revisao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_revisao TIMESTAMP,
    
    -- Estado da Carta
    estado VARCHAR(20) DEFAULT 'novo', -- 'novo', 'aprendizado', 'revisao', 'suspenso'
    
    CONSTRAINT fk_anki_frase FOREIGN KEY (frase_id) REFERENCES frases(id) ON DELETE CASCADE,
    CONSTRAINT fk_anki_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para performance nas revisões diárias
CREATE INDEX idx_anki_usuario_data ON anki_progresso(usuario_id, proxima_revisao);
CREATE INDEX idx_anki_estado ON anki_progresso(estado);


-- ==========================================
-- 10. TABELA DE HISTÓRICO DE REVISÕES
-- ==========================================
-- Essencial para gerar os gráficos de "progresso do usuário" (heatmap, progresso diário)
CREATE TABLE anki_historico (
    id SERIAL PRIMARY KEY,
    anki_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    
    data_revisao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nota INTEGER NOT NULL, -- 1 (Errei), 2 (Difícil), 3 (Bom), 4 (Fácil)
    intervalo_anterior INTEGER,
    novo_intervalo INTEGER,
    
    CONSTRAINT fk_hist_anki FOREIGN KEY (anki_id) REFERENCES anki_progresso(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_hist_usuario_data ON anki_historico(usuario_id, data_revisao);

-- -- Pegar frases que precisam ser revisadas hoje, trazendo a tradução e os detalhes da IA
--SELECT 
--    f.conteudo, 
--    fd.traducao_completa, 
--    fd.fatias_traducoes,
--    ap.facilidade,
--    ap.repeticoes
--FROM anki_progresso ap
--JOIN frases f ON ap.frase_id = f.id
--JOIN frase_detalhes fd ON f.id = fd.frase_id
--WHERE ap.usuario_id = 1 
--  AND ap.proxima_revisao <= CURRENT_TIMESTAMP
--ORDER BY ap.proxima_revisao ASC;-

-- ==========================================
-- 11. TABELA DE EXERCÍCIOS POLIMÓRFICA
-- ==========================================
CREATE TABLE exercicios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER, -- NULL para exercícios globais
    tipo_componente VARCHAR(50) NOT NULL, -- 'DragAndDrop', 'ImageTap', 'WordSorter', 'Brevity'
    
    -- O 'payload' contém tudo que o seu componente do React/JS precisa para renderizar
    -- Isso permite que cada tipo de exercício tenha uma estrutura de JSON completamente diferente
    dados_exercicio JSONB NOT NULL, 
    
    nivel INTEGER DEFAULT 1,
    tags TEXT[], -- ['gramatica', 'vocabulario', 'escrita']
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ex_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 1. Inserir Usuário de Teste (Senha: 'senha123' - hash simulado)
INSERT INTO usuarios (nome, email, senha_hash, token_extensao) 
VALUES ('Edrio', 'edrio@exemplo.com', '$$2a$13$cohNhJcAsLcQswiMIT1vX.lJ6uXsOBYXCbASYNmvmjd.izAkyMRl.', 'token');

-- 2. Configurar Preferências do Usuário
INSERT INTO preferencias_usuario (usuario_id, idioma_padrao_traducao, auto_traduzir, tema_interface)
VALUES (1, 'pt-BR', TRUE, 'dark');

-- 3. Criar Grupos de Estudo
INSERT INTO grupos (usuario_id, nome_grupo, descricao, cor_etiqueta)
VALUES 
(1, 'Programação Go', 'Frases sobre desenvolvimento em Go', '#00ADD8'),
(1, 'Expressões em Inglês', 'Gírias e phrasal verbs', '#FFD700');

-- 4. Inserir uma Frase capturada pela extensão
INSERT INTO frases (usuario_id, conteudo, idioma_origem, url_origem, titulo_pagina)
VALUES (1, 'I don''t wanna go home yet', 'en', 'https://lingua.com/english', 'Study Page');

-- 5. Simular o retorno da IA (JSONB com as fatias)
INSERT INTO frase_detalhes (frase_id, traducao_completa, explicacao, fatias_traducoes, modelo_ia)
VALUES (1, 
    'Eu não quero ir para casa ainda', 
    'A frase usa a contração informal "wanna" (want to).', 
    '{
        "I don''t": "Eu não",
        "wanna": "quero (querer)",
        "go home": "ir para casa",
        "yet": "ainda"
    }'::jsonb, 
    'gemini-1.5-flash');

-- 6. Vincular a frase ao grupo de Inglês
INSERT INTO frase_grupos (frase_id, grupo_id) VALUES (1, 2);