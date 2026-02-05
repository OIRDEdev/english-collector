
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