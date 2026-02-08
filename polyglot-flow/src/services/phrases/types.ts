// Phrase types matching Go backend

export interface Phrase {
  id: number;
  usuario_id: number;
  conteudo: string;
  idioma_origem: string;
  url_origem?: string;
  titulo_pagina?: string;
  contexto?: string;
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

// Phrase with embedded details (from paginated endpoint)
export interface PhraseWithDetails {
  id: number;
  usuario_id: number;
  conteudo: string;
  idioma_origem: string;
  url_origem?: string;
  titulo_pagina?: string;
  capturado_em: string;
  detalhes?: {
    traducao_completa: string;
    explicacao?: string;
    fatias_traducoes?: Record<string, string>;
    modelo_ia?: string;
  };
}

export interface CreatePhraseInput {
  usuario_id: number;
  conteudo: string;
  idioma_origem: string;
  url_origem?: string;
  titulo_pagina?: string;
  contexto?: string;
}

export interface UpdatePhraseInput {
  conteudo?: string;
  idioma_origem?: string;
  contexto?: string;
}

// Pagination types
export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}

// API Response wrapper (matches Go backend)
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
