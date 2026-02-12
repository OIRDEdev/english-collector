import apiService from './api';
import type { ExerciseGroup, ExerciseItem } from '@/types/api';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const exerciseService = {
  listGrouped: async (userId: number): Promise<ExerciseGroup[]> => {
    const response = await apiService.api.get<ApiResponse<ExerciseGroup[]>>(`/exercises?user_id=${userId}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<ExerciseItem> => {
    const response = await apiService.api.get<ApiResponse<ExerciseItem>>(`/exercises/${id}`);
    return response.data.data;
  },

  getByType: async (tipo: string, userId: number): Promise<ExerciseItem[]> => {
    const response = await apiService.api.get<ApiResponse<ExerciseItem[]>>(
      `/exercises/type/${tipo}?user_id=${userId}`
    );
    return response.data.data;
  },
};
