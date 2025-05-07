import { Component, OnInit } from '@angular/core';
import { FormsModule }      from '@angular/forms';
import { NgIf }             from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {PlayerService} from '../../../services/player.service';
import {GameService} from '../../../services/game.service';
import {player} from '../../../model/entities/player';
import {switchMap} from 'rxjs';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [ FormsModule, NgIf ],
  template: `
    <div class="card p-4 mx-auto" style="max-width:360px">
      <h4 class="mb-3">Partecipa alla Partita</h4>

      <!-- 1) Scegli nickname -->
      <form *ngIf="step===1" #nickForm="ngForm" (ngSubmit)="onNickname()">
        <div class="mb-3">
          <label class="form-label">Il tuo nickname</label>
          <input name="nick" class="form-control"
                 required minlength="3"
                 [(ngModel)]="nickname" #nick="ngModel">
          <!--
            <div *ngIf="nick.invalid && nick.touched" class="text-danger">
              {{ nick.errors?.['required'] ? 'Obbligatorio' : '' }}
              {{ nick.errors?.['minlength'] ? 'Minimo 3 caratteri' : '' }}

            </div>
         -->
        </div>
        <button class="btn btn-primary" [disabled]="nickForm.invalid">
          Avanti
        </button>
      </form>

      <!-- 2) Conferma ID partita e join -->
      <form *ngIf="step===2" #joinForm="ngForm" (ngSubmit)="onJoin()">
        <div class="mb-3">
          <label class="form-label">ID Partita</label>
          <input name="gameId" class="form-control"
                 [value]="gameId" readonly>
        </div>
        <button class="btn btn-success">
          Unisciti come {{ nickname }}
        </button>
      </form>
    </div>
  `
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
