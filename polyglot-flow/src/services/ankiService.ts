import apiService from './api';
import type { AnkiCard, AnkiReviewInput, AnkiReviewResult, AnkiStats } from '@/types/api';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const ankiService = {
  getDueCards: async (userId: number): Promise<AnkiCard[]> => {
    const response = await apiService.api.get<ApiResponse<AnkiCard[]>>(`/anki/due?user_id=${userId}`);
    return response.data.data;
  },

  submitReview: async (userId: number, input: AnkiReviewInput): Promise<AnkiReviewResult> => {
    const response = await apiService.api.post<ApiResponse<AnkiReviewResult>>(
      `/anki/review?user_id=${userId}`,
      input
    );
    return response.data.data;
  },

  getStats: async (userId: number): Promise<AnkiStats> => {
    const response = await apiService.api.get<ApiResponse<AnkiStats>>(`/anki/stats?user_id=${userId}`);
    return response.data.data;
  },
};
