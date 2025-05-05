import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'app-moves',
  imports: [
    NgForOf
  ],
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.css'
})
export class MovesComponent {
  moves = [
    { turn: 1, move: "(2, 3) → (3, 4)" },
    { turn: 2, move: "(5, 6) → (4, 5)" },
    { turn: 3, move: "(6, 7) → (5, 6)" }
  ];
}
