import apiService from './api';

export interface TranscriptLine {
  start: number;
  dur: number;
  text: string;
}

class YoutubeService {
  // Ex: en, pt, es... (opcional, o backend faz fallback para o User Profile via JWT)
  async getCaptions(videoId: string, lang?: string): Promise<TranscriptLine[]> {
    try {
      // Usar a instância de `api.ts` garante que os cookies de auth (JWT) viajem junto!
      const endpoint = lang ? `/youtube/transcript/${videoId}?lang=${lang}` : `/youtube/transcript/${videoId}`;
      const response = await apiService.api.get<TranscriptLine[]>(endpoint);
      console.log(response)
      return response.data;
    } catch (error) {
      console.error('Failed to fetch transcript from backend:', error);
      throw error;
    }
  }
}

export const youtubeService = new YoutubeService();
export default youtubeService;
