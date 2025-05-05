import { Component } from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {MovesComponent} from '../moves/moves.component';
import {ChatComponent} from '../chat/chat.component';

@Component({
  selector: 'app-board',
  imports: [
    NgForOf,
    NgClass,
    NgIf,
    MovesComponent,
    ChatComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent {
  board: any[][] = [];
  highlightedCells: { row: number, col: number }[] = [];

  ngOnInit() {
    this.initBoard();
  }

  initBoard() {
    const initialData = [
      [ "", "b", "", "b", "", "b", "", "b" ],
      [ "b", "", "b", "", "b", "", "b", "" ],
      [ "", "b", "", "b", "", "b", "", "b" ],
      [ "",  "",  "",  "",  "",  "",  "",  "" ],
      [ "",  "",  "",  "",  "",  "",  "",  "" ],
      [ "w", "", "w", "", "w", "", "w", "" ],
      [ "", "w", "", "w", "", "w", "", "w" ],
      [ "w", "", "w", "", "w", "", "w", "" ],
    ];

    this.board = initialData.map(row =>
      row.map(cell => ({
        hasPiece: cell === 'b' || cell === 'w',
        pieceColor: cell === 'b' ? 'black' : cell === 'w' ? 'white' : null
      }))
    );
  }

  isLight(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }

  isHighlight(row: number, col: number): boolean {
    return this.highlightedCells.some(cell => cell.row === row && cell.col === col);
  }

  onCellClick(row: number, col: number): void {
    const cell = this.board[row][col];

    if (!cell.hasPiece) return;
    this.highlightedCells = [];

    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    directions.forEach(([dr, dc]) => {
      const r2 = row + dr;
      const c2 = col + dc;
      if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
        const target = this.board[r2][c2];
        if (!target.hasPiece) {
          this.highlightedCells.push({ row: r2, col: c2 });
        }
      }
    });
  }
}
