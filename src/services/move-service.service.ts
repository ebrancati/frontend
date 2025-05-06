import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Move} from '../model/Move';

@Injectable({
  providedIn: 'root'
})
export class MoveServiceService {

  constructor(private http:HttpClient)
  {
  }

  saveMove(move: Move,gameID:string)
  {
    return this.http.post<Move>(`/api/games/${gameID}/move`, move);
  }
}
