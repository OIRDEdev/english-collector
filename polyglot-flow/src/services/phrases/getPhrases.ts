import apiService from '../api';
import type { Phrase, ApiResponse } from './types';

export async function getPhrases(): Promise<Phrase[]> {
  const response = await apiService.api.get<ApiResponse<Phrase[]>>('/phrases');
  return response.data.data ?? [];
}
