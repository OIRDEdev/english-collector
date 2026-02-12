// Tipos baseados na API Go

export interface User {
  id: number;
  nome: string;
  email: string;
  token_extensao?: string;
  criado_em: string;
}

export interface RefreshToken {
  id: number;
  usuario_id: number;
  token: string;
  expira_em: string;
  criado_em: string;
  revogado: boolean;
}

export interface Phrase {
  id: number;
  usuario_id: number;
  conteudo: string;
  idioma_origem: string;
  url_origem?: string;
  titulo_pagina?: string;
  capturado_em: string;
}

export interface PhraseDetails {
  id: number;
  frase_id: number;
  traducao_completa: string;
  explicacao?: string;
  fatias_traducoes?: Record<string, string>;
  modelo_ia?: string;
  processado_em: string;
}

export interface Group {
  id: number;
  usuario_id: number;
  nome_grupo: string;
  descricao?: string;
  cor_etiqueta?: string;
  criado_em: string;
}

export interface PhraseGroup {
  frase_id: number;
  grupo_id: number;
}

// Auth Types
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// Anki Types
export interface AnkiCard {
  id: number;
  frase_id: number;
  conteudo: string;
  traducao_completa: string;
  fatias_traducoes?: Record<string, string>;
  facilidade: number;
  intervalo: number;
  repeticoes: number;
  sequencia_acertos: number;
  estado: string;
  proxima_revisao: string;
}

export interface AnkiReviewInput {
  anki_id: number;
  nota: number; // 1=Errei, 2=Difícil, 3=Bom, 4=Fácil
}

export interface AnkiReviewResult {
  novo_intervalo: number;
  nova_facilidade: number;
  proxima_revisao: string;
  estado: string;
}

export interface AnkiStats {
  total_cards: number;
  due_today: number;
  novos: number;
  aprendendo: number;
  revisao: number;
}

// Exercise Types
export interface ExerciseItem {
  id: number;
  usuario_id?: number;
  tipo_componente: string;
  dados_exercicio: Record<string, any>;
  nivel: number;
  tags: string[];
  criado_em: string;
}

export interface ExerciseGroup {
  tipo: string;
  origem: string;
  data: ExerciseItem[];
}
