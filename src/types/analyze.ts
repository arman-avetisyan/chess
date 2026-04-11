export type AnalyzeMove = {
  san: string;
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};

export type AnalyzePayload = {
  fen: string;
  moves?: AnalyzeMove[];
};
