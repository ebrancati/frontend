import { Component, Input, OnChanges } from '@angular/core';
import { NgForOf } from '@angular/common';

interface Move {
  from: { row: number, col: number };
  to: { row: number, col: number };
  captured?: { row: number, col: number }[];
}

interface TurnMoves {
  number: number;
  white?: string;
  black?: string;
}

@Component({
  selector: 'app-moves',
  imports: [
    NgForOf
  ],
  templateUrl: './moves.component.html',
  styleUrl: './moves.component.css',
  standalone: true
})
export class MovesComponent implements OnChanges {
  @Input() moves: Move[] = [];
  displayMoves: TurnMoves[] = [];
 
  ngOnChanges(): void {
    this.displayMoves = [];
    
    // Organize moves in pairs (white, black) by turn
    for (let i = 0; i < this.moves.length; i += 2) {
      const turnNumber = Math.floor(i / 2) + 1;
      const whiteMove = this.moves[i] ? this.formatMove(this.moves[i]) : undefined;
      const blackMove = this.moves[i + 1] ? this.formatMove(this.moves[i + 1]) : undefined;
      
      this.displayMoves.push({
        number: turnNumber,
        white: whiteMove,
        black: blackMove
      });
    }
  }
  
  /**
   * Converts board coordinates to algebraic notation (e.g., "e5")
   * @param row - Row index (0-7)
   * @param col - Column index (0-7)
   * @returns Algebraic notation
   */
  private toAlgebraic(row: number, col: number): string {
    const columns = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const rows = ['8', '7', '6', '5', '4', '3', '2', '1'];
    return columns[col] + rows[row];
  }
  
  private formatMove(move: Move): string {
    const from = this.toAlgebraic(move.from.row, move.from.col);
    const to = this.toAlgebraic(move.to.row, move.to.col);
    return move.captured ? `${from}x${to}` : `${from}-${to}`;
  }
}