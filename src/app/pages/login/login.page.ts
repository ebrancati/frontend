import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from "../../../services/game.service";
import { PlayerService } from "../../../services/player.service";
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-login',
  standalone: true,
  imports: [
    FormsModule, TranslateModule
  ],
  templateUrl: './login.page.html',
})
export class LoginPage {
  nickname = '';
  joinGameId = '';
  preferredTeam = 'WHITE'; // Default a bianco

  constructor(
    private playerSvc: PlayerService,
    private gameSvc: GameService,
    private router: Router
  ) {}

  newGame() {
    const player = { 
      nickname: this.nickname,
      preferredTeam: this.preferredTeam 
    };
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
          this.router.navigate(['/game', this.joinGameId]);
        } else {
          console.error('Join fallito');
        }
      },
      error: err => console.error('Errore join:', err)
    });
  }
}