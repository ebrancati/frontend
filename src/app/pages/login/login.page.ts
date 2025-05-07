import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {GameService} from "../../../services/game.service";
import {PlayerService} from "../../../services/player.service";
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { NgIf, NgForOf }            from '@angular/common';
import {switchMap} from 'rxjs';

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
    localStorage.setItem('nickname', this.nickname);
    this.playerSvc.createPlayer(player).subscribe(() => {
      this.gameSvc.createGame(player).subscribe(gs => {
        this.router.navigate(['/game', gs.id]);
      });
    });
  }

  join() {
    const player = { nickname: this.nickname };
    localStorage.setItem('nickname', this.nickname);
    this.playerSvc.createPlayer(player).pipe(
      switchMap(() => this.gameSvc.joinGame(this.joinGameId, player))
    ).subscribe({
      next: (success) => {
        if (success) {
          // Usi direttamente l'ID che già conosci
          this.router.navigate(['/game', this.joinGameId]);
        } else {
          // Gestisci l'errore lato UI
          console.error('Join fallito');
        }
      },
      error: err => console.error('Errore join:', err)
    });
  }

}
