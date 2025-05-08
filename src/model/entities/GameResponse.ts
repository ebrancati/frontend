interface GameResponse {
  id: string;
  board: string[][];
  turno: string;  // "WHITE" or "BLACK"
  pedineW: number;
  pedineB: number;
  damaW: number;
  damaB: number;
  partitaTerminata: boolean;
  vincitore: string;  // "NONE", "WHITE", or "BLACK"
  chat: string;
  players:
    {
    id: string;
    nickname: string;
    team: string;  // "WHITE" or "BLACK"
  }[];
}
