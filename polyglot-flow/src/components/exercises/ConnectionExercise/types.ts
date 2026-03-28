export interface ConnectionData {
  data: {
    connector: string[];
    sentence: string;
    time: string;
    answer: string;
  };
}

export interface ConnectionProps {
  data: ConnectionData;
  onComplete: (score: number) => void;
  onExit: () => void;
}
