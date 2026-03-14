import apiService from './api';

export interface TranscriptLine {
  start: number;
  dur: number;
  text: string;
}

class YoutubeService {
  async getTranscript(videoId: string): Promise<TranscriptLine[]> {
    try {
      const response = await apiService.api.get<TranscriptLine[]>(`/youtube/transcript/${videoId}`);
      console.log(response.data);
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
