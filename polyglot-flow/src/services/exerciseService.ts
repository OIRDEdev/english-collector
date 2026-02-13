import apiService from './api';
import type { TipoComCatalogo, ExerciseItem } from '@/types/api';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const exerciseService = {
  // Lista tipos com catálogos (para a tela /exercises)
  listCatalog: async (): Promise<TipoComCatalogo[]> => {
    const response = await apiService.api.get<ApiResponse<TipoComCatalogo[]>>('/exercises');
    return response.data.data;
  },

  // Pega exercícios de um catálogo (quando clica "Iniciar")
  getByCatalogo: async (catalogoId: number, limit = 3): Promise<ExerciseItem[]> => {
    const response = await apiService.api.get<ApiResponse<ExerciseItem[]>>(
      `/exercises/catalogo/${catalogoId}?limit=${limit}`
    );
    return response.data.data;
  },

  // Pega um exercício por ID
  getById: async (id: number): Promise<ExerciseItem> => {
    const response = await apiService.api.get<ApiResponse<ExerciseItem>>(`/exercises/${id}`);
    return response.data.data;
  },

  // Chain exercise: pega a próxima palavra da IA
  chainNextWord: async (sentenceSoFar: string): Promise<{ nextword: string }> => {
    const response = await apiService.api.post<ApiResponse<{ nextword: string }>>(
      '/exercises/chain/next-word',
      { sentence_so_far: sentenceSoFar }
    );
    return response.data.data;
  },
};
