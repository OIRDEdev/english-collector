
CREATE TABLE anki_historico (
    id integer NOT NULL,
    anki_id integer NOT NULL,
    usuario_id integer NOT NULL,
    data_revisao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    nota integer NOT NULL,
    intervalo_anterior integer,
    novo_intervalo integer
);


ALTER TABLE anki_historico OWNER TO neondb_owner;


CREATE TABLE anki_progresso (
    id integer NOT NULL,
    frase_id integer NOT NULL,
    usuario_id integer NOT NULL,
    facilidade numeric(5,2) DEFAULT 2.50,
    intervalo integer DEFAULT 0,
    repeticoes integer DEFAULT 0,
    sequencia_acertos integer DEFAULT 0,
    proxima_revisao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultima_revisao timestamp without time zone,
    estado varchar(20) DEFAULT 'novo'::varchar
);



CREATE TABLE assinaturas (
    id integer NOT NULL,
    usuario_principal_id integer NOT NULL,
    plano_id integer NOT NULL,
    status varchar(30) NOT NULL,
    infinitypay_subscription_id varchar(255),
    iniciado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expira_em timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE conta_usuarios (
    id integer NOT NULL,
    usuario_principal_id integer NOT NULL,
    usuario_vinculado_id integer NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE exercicios (
    id integer NOT NULL,
    usuario_id integer,
    dados_exercicio jsonb NOT NULL,
    nivel integer DEFAULT 1,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    catalogo_id integer
);



CREATE TABLE exercicios_catalogo (
    id integer NOT NULL,
    nome varchar(150) NOT NULL,
    tipo_id integer NOT NULL,
    descricao text,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    proef_base integer DEFAULT 10,
    proef_bonus integer DEFAULT 0
);




CREATE TABLE frase_detalhes (
    id integer NOT NULL,
    frase_id integer NOT NULL,
    traducao_completa text NOT NULL,
    explicacao text,
    fatias_traducoes jsonb,
    modelo_ia varchar(50),
    processado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);






CREATE TABLE frase_grupos (
    frase_id integer NOT NULL,
    grupo_id integer NOT NULL
);




CREATE TABLE frases (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    conteudo text NOT NULL,
    idioma_origem varchar(10) DEFAULT 'en'::varchar,
    url_origem text,
    titulo_pagina varchar(255),
    capturado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE frases OWNER TO neondb_owner;


CREATE TABLE grupos (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    nome_grupo varchar(100) NOT NULL,
    descricao text,
    cor_etiqueta varchar(7),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE logs_ia (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    frase_id integer NOT NULL,
    modelo_utilizado varchar(50),
    tokens_prompt integer,
    tokens_completion integer,
    custo_estimado numeric(10,5),
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE niveis (
    nivel integer NOT NULL,
    proeficiencia_min integer NOT NULL
);



CREATE TABLE pagamentos (
    id integer NOT NULL,
    assinatura_id integer NOT NULL,
    infinitypay_payment_id varchar(255),
    valor numeric(10,2) NOT NULL,
    status varchar(30) NOT NULL,
    metodo_pagamento varchar(50),
    payload jsonb,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE planos (
    id integer NOT NULL,
    nome varchar(100) NOT NULL,
    preco numeric(10,2) NOT NULL,
    limite_usuarios integer DEFAULT 1,
    limite_frases_dia integer,
    limite_exercicios_dia integer,
    limite_conversas_semana integer,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE preferencias_usuario (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    idioma_padrao_traducao varchar(10) DEFAULT 'pt-BR'::varchar,
    auto_traduzir boolean DEFAULT false,
    tema_interface varchar(20) DEFAULT 'dark'::varchar,
    config jsonb DEFAULT '{}'::jsonb
);




CREATE TABLE refresh_tokens (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    token varchar(255) NOT NULL,
    expira_em timestamp without time zone NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    revogado boolean DEFAULT false,
    ip varchar(50),
    user_agent text
);




CREATE TABLE tipos_exercicio (
    id integer NOT NULL,
    nome varchar(100) NOT NULL,
    descricao text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE usuario_estatisticas (
    usuario_id integer NOT NULL,
    total_exercicios integer DEFAULT 0,
    total_acertos integer DEFAULT 0,
    total_erros integer DEFAULT 0,
    total_prof integer DEFAULT 0,
    nivel integer DEFAULT 1,
    ofensiva_dias integer DEFAULT 0,
    melhor_ofensiva integer DEFAULT 0,
    ultima_atividade timestamp without time zone,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);




CREATE TABLE usuario_estatisticas_exercicio (
    usuario_id integer NOT NULL,
    exercicio_id integer NOT NULL,
    total_respostas integer DEFAULT 0,
    total_acertos integer DEFAULT 0,
    melhor_nivel integer DEFAULT 1
);



CREATE TABLE usuario_estatisticas_tipo (
    usuario_id integer NOT NULL,
    tipo_exercicio_id integer NOT NULL,
    total_respostas integer DEFAULT 0,
    total_acertos integer DEFAULT 0,
    total_erros integer DEFAULT 0,
    proef_ganho integer DEFAULT 0
);



CREATE TABLE usuarios (
    id integer NOT NULL,
    nome varchar(100) NOT NULL,
    email varchar(150) NOT NULL,
    senha_hash varchar(255) NOT NULL,
    token_extensao varchar(255),
    lingua_origem  varchar(20),
    lingua_de_aprendizado  varchar(20),  -- Added comma
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);
