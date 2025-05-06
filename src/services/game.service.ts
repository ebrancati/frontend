import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {player} from '../model/player';
import {GameState} from '../model/GameState';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private api = '/api/games';

  constructor(private http: HttpClient) {}

  createGame(nickname: player) {
    return this.http.post<GameState>(`/api/games/create`, nickname);
  }

  joinGame(gameId: string, nickname: player){
    return this.http.post<GameState>(`/api/games//join/${gameId}`, nickname);
  }
}
