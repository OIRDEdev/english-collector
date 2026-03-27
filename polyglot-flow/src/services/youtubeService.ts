import apiService from './api';

export interface TranslationSegment {
  start: number;
  dur: number;
  text_en: string;
  text_pt: string;
  explanation: string;
  mapping: Record<string, string>;
}

class YoutubeService {
  // Ex: en, pt, es... (opcional, o backend faz fallback para o User Profile via JWT)
  async getCaptions(videoId: string, lang?: string, start?: number, end?: number): Promise<TranslationSegment[]> {
    try {
      let endpoint = lang ? `/youtube/transcript/${videoId}?lang=${lang}` : `/youtube/transcript/${videoId}`;
      
      const params = new URLSearchParams();
      if (start !== undefined) params.append('start', start.toString());
      if (end !== undefined) params.append('end', end.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += (endpoint.includes('?') ? '&' : '?') + queryString;
      }

      const response = await apiService.api.get<TranslationSegment[]>(endpoint);
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
