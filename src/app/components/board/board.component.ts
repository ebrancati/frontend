import { Component } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { MovesComponent } from '../moves/moves.component';
import { ChatComponent } from '../chat/chat.component';

/**
 * Interface representing a cell on the checkers board
 */
interface Cell {
  hasPiece: boolean;
  pieceColor: 'black' | 'white' | null;
  isKing: boolean;
}

/**
 * Interface representing a move in the game
 */
interface Move {
  from: { row: number, col: number };
  to: { row: number, col: number };
  captured?: { row: number, col: number }[];
}

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
  board: Cell[][] = [];
  highlightedCells: { row: number, col: number }[] = [];
  selectedCell: { row: number, col: number } | null = null;
  currentPlayer: 'black' | 'white' = 'white';
  moves: Move[] = [];

  gameOver: boolean = false;
  showGameOverModal: boolean = false;
  winner: 'black' | 'white' | null = null;
  whiteCount:number = 12;
  blackCount:number = 12;

  columns: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  rows: string[] = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  ngOnInit() {
    this.initBoard();
  }
  
  /**
   * Initialize the game board with pieces in starting positions
   */
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
        pieceColor: cell === 'b' ? 'black' : cell === 'w' ? 'white' : null,
        isKing: false
      }))
    );
    
    this.currentPlayer = 'white'; // turno iniziale
    this.moves = []; // memorizza cronologia mosse
    this.gameOver = false; // partita non terminata
    this.showGameOverModal = false; // nasconde modale di fine partita
    this.winner = null;
    this.highlightedCells = []; // pulisce celle evidenziate sulla scacchiera
    this.selectedCell = null; // nessun pezzo è selezionato
  }
  
  /**
   * Determines if a cell should be colored light
   * @param row - Row index of the cell
   * @param col - Column index of the cell
   * @returns True if the cell should be light colored
   */
  isLight(row: number, col: number): boolean {
    return (row + col) % 2 === 0;
  }
  
  /**
   * Determines if a cell should be highlighted as a possible move
   * @param row - Row index of the cell
   * @param col - Column index of the cell
   * @returns True if the cell is a possible move
   */
  isHighlight(row: number, col: number): boolean {
    return this.highlightedCells.some(cell => cell.row === row && cell.col === col);
  }
  
  /**
   * Determines if a cell is currently selected
   * @param row - Row index of the cell
   * @param col - Column index of the cell
   * @returns True if the cell is currently selected
   */
  isSelected(row: number, col: number): boolean {
    return this.selectedCell?.row === row && this.selectedCell?.col === col;
  }
  
  /**
   * Handles click events on board cells
   * @param row - Row index of the clicked cell
   * @param col - Column index of the clicked cell
  */
  onCellClick(row: number, col: number): void {

    if (this.gameOver) return;
    
    const cell = this.board[row][col];
    
    // If a highlighted cell is clicked, it means making a move
    if (this.isHighlight(row, col) && this.selectedCell) {
      this.makeMove(this.selectedCell.row, this.selectedCell.col, row, col);
      return;
    }
    
    // Clear previous highlights if clicking on a new cell
    this.highlightedCells = [];
    
    // If the cell has no piece or it's not the current player's piece, do nothing
    if (!cell.hasPiece || cell.pieceColor !== this.currentPlayer) {
      this.selectedCell = null;
      return;
    }

    this.selectedCell = { row, col };
    
    // Get and show all possible moves
    this.highlightedCells = this.getValidMoves(row, col);
  }
  
  /**
   * Gets valid moves for a piece at the specified position
   * @param row - Row index of the piece
   * @param col - Column index of the piece
   * @returns Array of positions representing valid moves
   */
  getValidMoves(row: number, col: number): { row: number, col: number }[] {
    const validMoves: { row: number, col: number }[] = [];
    const cell = this.board[row][col];
    
    // Check if there are any forced captures first
    const allCaptures = this.getAllForcedCaptures();
    
    // If there are forced captures, only return those for this piece
    if (allCaptures.length > 0) {
      return allCaptures
        .filter(m => m.from.row === row && m.from.col === col)
        .map(m => m.to);
    }
    
    // No forced captures, so return regular moves
    const directions = cell.isKing 
      ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] // Kings can move in all diagonal directions
      : cell.pieceColor === 'white' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]; // Regular pieces move forward only
    

    // calcola e aggiunge le mosse normali (non di cattura) che un pezzo può fare
    directions.forEach(([dr, dc]) => {
      const r2 = row + dr;
      const c2 = col + dc;
      
      if (this.isValidPosition(r2, c2) && !this.board[r2][c2].hasPiece) {
        validMoves.push({ row: r2, col: c2 });
      }
    });
    
    return validMoves;
  }
  
  /**
   * Gets all possible capture moves for the current player
   * @returns Array of moves that involve capturing opponent pieces
   */
  getAllForcedCaptures(): Move[] {
    const captures: Move[] = [];
    
    // Scan the entire board for forced captures
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        
        // Skip empty cells or opponent's pieces
        if (!cell.hasPiece || cell.pieceColor !== this.currentPlayer) continue;
        
        // Get captures for this piece
        const pieceCapturesMoves = this.getCapturesForPiece(r, c);
        captures.push(...pieceCapturesMoves);
      }
    }
    
    return captures;
  }
  
  /**
   * Gets all possible capture moves for a specific piece
   * @param row - Row index of the piece
   * @param col - Column index of the piece
   * @returns Array of capture moves for the piece
   */
  getCapturesForPiece(row: number, col: number): Move[] {
    const captures: Move[] = [];
    const cell = this.board[row][col];
    
    // Define directions to check based on piece type
    const directions = cell.isKing 
      ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] // Kings can capture in all diagonal directions
      : cell.pieceColor === 'white' ? [[-1, 1], [-1, -1]] : [[1, 1], [1, -1]]; // Regular pieces move forward only
    
    // Check each direction for capture opportunities
    directions.forEach(([dr, dc]) => {
      const captureRow = row + dr;
      const captureCol = col + dc;
      const landRow = row + 2 * dr;
      const landCol = col + 2 * dc;
      
      // Make sure positions are valid
      if (!this.isValidPosition(captureRow, captureCol) || !this.isValidPosition(landRow, landCol)) {
        return;
      }
      
      // ottiene la cella che contiene il pezzo avversario che potrebbe essere catturato
      const captureCell = this.board[captureRow][captureCol];
      // ottiene la cella in cui il pezzo atterrerebbe dopo aver effettuato la cattura
      const landCell = this.board[landRow][landCol];
      
      // Check if there's an opponent's piece to capture and an empty cell to land on
      if (captureCell.hasPiece && captureCell.pieceColor !== cell.pieceColor && !landCell.hasPiece) {
        captures.push({
          from: { row, col },
          to: { row: landRow, col: landCol },
          captured: [{ row: captureRow, col: captureCol }]
        });
      }
    });
    
    return captures;
  }
  
  /**
   * Executes a move from one position to another
   * @param fromRow - Starting row
   * @param fromCol - Starting column
   * @param toRow - Destination row
   * @param toCol - Destination column
   */
  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    // Check if this is a capture move
    const isCapture = Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2;
    
    // Update the board
    const movingPiece = this.board[fromRow][fromCol];
    
    // Make the move
    this.board[toRow][toCol] = { 
      hasPiece: true, 
      pieceColor: movingPiece.pieceColor,
      isKing: movingPiece.isKing
    };
    this.board[fromRow][fromCol] = { 
      hasPiece: false, 
      pieceColor: null, 
      isKing: false
    };
    
    // Handle captures
    let capturedPiece = null;
    if (isCapture) {
      const captureRow = fromRow + (toRow - fromRow) / 2;
      const captureCol = fromCol + (toCol - fromCol) / 2;
      capturedPiece = this.board[captureRow][captureCol];
      this.board[captureRow][captureCol] = { 
        hasPiece: false, 
        pieceColor: null, 
        isKing: false
      };
    }
    
    // Check for king promotion
    if (!movingPiece.isKing) {
      if ((movingPiece.pieceColor === 'white' && toRow === 0) ||
          (movingPiece.pieceColor === 'black' && toRow === 7)) {
        this.board[toRow][toCol].isKing = true;
      }
    }
    
    // Record the move
    this.moves = [...this.moves, {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: isCapture ? [{ row: fromRow + (toRow - fromRow) / 2, col: fromCol + (toCol - fromCol) / 2 }] : undefined
    }];
    
    // Check for additional captures from the new position
    const additionalCaptures = this.getCapturesForPiece(toRow, toCol);
    if (isCapture && additionalCaptures.length > 0) {
      // We have more captures available for this piece
      this.selectedCell = { row: toRow, col: toCol };
      this.highlightedCells = additionalCaptures.map(move => move.to);
    } else {
      // Switch to the next player
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      this.selectedCell = null;
      this.highlightedCells = [];
      
      // Check for game over
      this.checkGameOver();
    }
  }
  
  /**
   * Checks if the game is over and determines the winner
   */
  checkGameOver(): void {
    // Check if a player has no pieces left
    this.whiteCount = 0;
    this.blackCount = 0;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (cell.hasPiece) {
          if (cell.pieceColor === 'white') this.whiteCount++;
          else this.blackCount++;
        }
      }
    }
    
    if (this.whiteCount === 0) {
      this.gameOver = true;
      this.winner = 'black'; // Il nero vince se il bianco non ha pezzi
      this.showGameOverModal = true;
      return;
    }
    
    if (this.blackCount === 0) {
      this.gameOver = true;
      this.winner = 'white'; // Il bianco vince se il nero non ha pezzi
      this.showGameOverModal = true;
      return;
    }
    
    // Check if current player has valid moves
    let hasValidMoves = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (cell.hasPiece && cell.pieceColor === this.currentPlayer) {
          const moves = this.getValidMoves(r, c);
          if (moves.length > 0) {
            // Player has at least one valid move
            hasValidMoves = true;
            break;
          }
        }
      }
      if (hasValidMoves) break;
    }
    
    // If current player has no valid moves, they lose
    if (!hasValidMoves) {
      this.gameOver = true;
      this.winner = this.currentPlayer === 'white' ? 'black' : 'white';
      this.showGameOverModal = true;
    }
  }
  
  /**
   * Hides the game over modal
   */
  hideGameOverModal(): void {
    this.showGameOverModal = false;
  }
  
  /**
   * Checks if a position is within the board boundaries
   * @param row - Row index to check
   * @param col - Column index to check
   * @returns True if the position is valid
   */
  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
  
  /**
   * Resets the game to its initial state
   */
  resetGame(): void {
    this.initBoard();
  }
}