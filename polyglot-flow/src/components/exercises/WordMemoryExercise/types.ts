export interface WordPair {
  pt: string;
  en: string;
}

export interface WordMemoryData {
  data: {
    wordList: WordPair[];
    timeLimit: number;
  };
}

export interface WordMemoryProps {
  data: WordMemoryData;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export type WordStatus = "pending" | "correct" | "wrong";
