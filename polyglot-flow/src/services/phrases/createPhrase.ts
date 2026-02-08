import apiService from '../api';
import type { Phrase, CreatePhraseInput, ApiResponse } from './types';

export async function createPhrase(input: CreatePhraseInput): Promise<Phrase> {
  const response = await apiService.api.post<ApiResponse<Phrase>>('/phrases', input);
  if (!response.data.data) {
    throw new Error(response.data.error || 'Failed to create phrase');
  }
  return response.data.data;
}
