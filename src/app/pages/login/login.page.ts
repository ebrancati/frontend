import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {GameService} from "../../../services/game.service";
import {PlayerService} from "../../../services/player.service";
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { NgIf, NgForOf }            from '@angular/common';

@Component({
  selector: 'page-login',
  standalone: true,
  imports: [
    FormsModule,  // contiene anche le direttive NgForm e NgModel
    NgIf,
    NgForOf,

  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
  nickname = '';
  joinGameId = '';

  constructor(
      private playerSvc: PlayerService,
      private gameSvc: GameService,
      private router: Router
  ) {}

  newGame() {
    const player = { nickname: this.nickname };
    this.playerSvc.createPlayer(player).subscribe(() => {
      this.gameSvc.createGame(player).subscribe(gs => {
        this.router.navigate(['/game', gs.id]);
      });
    });
  }

  join() {
    const player = { nickname: this.nickname };
    this.playerSvc.createPlayer(player).subscribe(() => {
      this.gameSvc.joinGame(this.joinGameId, player).subscribe(gs => {
        this.router.navigate(['/game', gs.id]);
      });
    });
  }
}
