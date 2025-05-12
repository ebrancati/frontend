import { Component, OnInit } from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { NgIf }             from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {PlayerService} from '../../../services/player.service';
import {GameService} from '../../../services/game.service';
import {player} from '../../../model/entities/player';
import {switchMap} from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [ FormsModule, NgIf, TranslateModule ],
  templateUrl: './join.component.html'
})
export class JoinComponent implements OnInit {
  step = 1;
  nickname = '';
  gameId!: string;

  constructor(
    private route: ActivatedRoute,
    private playerSvc: PlayerService,
    private gameSvc: GameService,
    private router: Router
  ) {}

  ngOnInit() {
    this.gameId = this.route.snapshot.paramMap.get('gameId')!;
  }

  onNickname() {
    // passo al form di join
    this.step = 2;
  }

  onJoin() {
    localStorage.setItem('nickname', this.nickname);
    const dto: player = { nickname: this.nickname };
    this.playerSvc.createPlayer(dto).pipe(
      switchMap(() => this.gameSvc.joinGame(this.gameId, dto))
    ).subscribe(() => {
      this.router.navigate(['/game', this.gameId]);
    });
  }
}
