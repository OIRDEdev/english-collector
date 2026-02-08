// Group types matching Go backend

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

export interface CreateGroupInput {
  usuario_id: number;
  nome_grupo: string;
  descricao?: string;
  cor_etiqueta?: string;
}

export interface UpdateGroupInput {
  nome_grupo?: string;
  descricao?: string;
  cor_etiqueta?: string;
}

// API Response wrapper (matches Go backend)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
