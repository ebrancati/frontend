import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {player} from '../model/entities/player';
import {GameState} from '../model/entities/GameState';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  constructor(private http: HttpClient) {}

  getGameState(gameId: string) {
    return this.http.get<any>(`/api/games/${gameId}`);
  }

  createGame(nickname: player) {
    return this.http.post<GameState>(`/api/games/create`, nickname);
  }

  joinGame(gameId: string, nickname: player){
    return this.http.post<boolean>(`/api/games/join/${gameId}`, nickname);
  }

  deleteGame(gameId:string)
  {
    return this.http.delete(`/api/games/${gameId}`);
  }
}
