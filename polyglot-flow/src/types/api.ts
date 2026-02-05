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
