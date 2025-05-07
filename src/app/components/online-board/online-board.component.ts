import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { MovesComponent } from '../moves/moves.component';
import { ChatComponent } from '../chat/chat.component';
import { MoveServiceService } from '../../../services/move-service.service';
import { GameService } from '../../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { interval, Subscription } from 'rxjs';

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

// Interface for the response from the server
interface GameResponse {
  id: string;
  board: string[][];
  turno: string;  // "WHITE" or "BLACK"
  pedineW: number;
  pedineB: number;
  damaW: number;
  damaB: number;
  partitaTerminata: boolean;
  vincitore: string;  // "NONE", "WHITE", or "BLACK"
  players: {
    id: string;
    nickname: string;
    team: string;  // "WHITE" or "BLACK"
  }[];
}

@Component({
  selector: 'app-online-board',
  imports: [
    NgForOf,
    NgClass,
    NgIf,
    MovesComponent,
    ChatComponent
  ],
  templateUrl: './online-board.component.html',
  styleUrl: './online-board.component.css',
  standalone: true
})
export class OnlineBoardComponent implements OnInit, OnDestroy {
  origin: string | undefined
  board: Cell[][] = [];
  highlightedCells: { row: number, col: number }[] = [];
  selectedCell: { row: number, col: number } | null = null;
  currentPlayer: 'black' | 'white' = 'white';
  playerTeam: 'WHITE' | 'BLACK' | null = null;

  whitePlayerNickname: string = 'Giocatore Bianco';
  blackPlayerNickname: string = 'Giocatore Nero';

  moves: Move[] = [];
  gameID: string = '';
  pollingSubscription: Subscription | null = null;

  gameOver: boolean = false;
  showGameOverModal: boolean = false;
  winner: 'black' | 'white' | null = null;
  whiteCount: number = 12;
  blackCount: number = 12;
  columns: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  rows: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

  constructor(
    private moveService: MoveServiceService,
    private gameService: GameService,
    private route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.origin = this.document.location.origin;
  }

  ngOnInit() {
    this.gameID = this.route.snapshot.paramMap.get('gameId')!;
    this.initBoard();

    // Inizia il polling per aggiornamenti di stato
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  /**
   * Start polling for game state updates
   */
  startPolling() {
    // Fai subito una chiamata iniziale
    this.fetchGameState();

    // Poi inizia il polling ogni 2 secondi
    this.pollingSubscription = interval(2000).subscribe(() => {
      this.fetchGameState();
    });
  }

  /**
   * Fetch the current game state from the backend
   */
  fetchGameState() {
    if (!this.gameID) return;

    this.gameService.getGameState(this.gameID).subscribe({
      next: (response: GameResponse) => {
        console.log('Game state response:', response);

        const nickname = localStorage.getItem('nickname');
        console.log('Nickname corrente in localStorage:', nickname);

        if (nickname) {
          // Cerca il giocatore tra quelli nella partita
          const playerMatch = response.players.find(p => p.nickname === nickname);
          if (playerMatch) {
            this.playerTeam = playerMatch.team as 'WHITE' | 'BLACK';
            console.log(`Trovato giocatore con nickname ${nickname}, team assegnato: ${this.playerTeam}`);
          } else {
            console.log(`Nessun giocatore con nickname ${nickname} trovato nei giocatori della partita`);
          }
        } else {
          console.log('Nessun nickname trovato in localStorage');
        }

        // Aggiorna i nickname dei giocatori
        for (const player of response.players) {
          if (player.team === 'WHITE') {
            this.whitePlayerNickname = player.nickname;
          } else if (player.team === 'BLACK') {
            this.blackPlayerNickname = player.nickname;
          }
        }

        // Aggiorna lo stato del gioco
        this.updateGameState(response);
      },
      error: (error) => {
        console.error('Errore nel recupero dello stato del gioco:', error);
      }
    });
  }

  /**
   * Updates the game state based on the response from the server
   */
  updateGameState(response: GameResponse) {
    // Aggiorna il turno corrente
    this.currentPlayer = response.turno === 'WHITE' ? 'white' : 'black';

    // Aggiorna la board
    this.updateBoardFromState(response.board);

    // Aggiorna conteggi pedine
    this.whiteCount = response.pedineW + response.damaW;
    this.blackCount = response.pedineB + response.damaB;

    // Aggiorna stato fine partita
    this.gameOver = response.partitaTerminata;
    if (this.gameOver && response.vincitore !== 'NONE') {
      this.winner = response.vincitore === 'WHITE' ? 'white' : 'black';
      this.showGameOverModal = true;
    }

    console.log(`Stato aggiornato: Turno ${this.currentPlayer}, Team giocatore: ${this.playerTeam}`);
  }

  /**
   * Updates the board based on the state received from the server
   */
  updateBoardFromState(boardState: string[][]) {
    if (!boardState || !Array.isArray(boardState)) return;

    this.board = boardState.map(row =>
      row.map(cell => ({
        hasPiece: cell !== '',
        pieceColor: cell === 'b' || cell === 'B' ? 'black' : cell === 'w' || cell === 'W' ? 'white' : null,
        isKing: cell === 'B' || cell === 'W'
      }))
    );
  }

  /**
   * Check if it's the current player's turn
   */
  isPlayerTurn(): boolean {
    if (!this.playerTeam) return false;

    const isPlayerTurn = (this.playerTeam === 'WHITE' && this.currentPlayer === 'white') ||
                          (this.playerTeam === 'BLACK' && this.currentPlayer === 'black');

    return isPlayerTurn;
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

    // Verifica se è il turno del giocatore
    if (!this.isPlayerTurn()) {
      console.log('Non è il tuo turno! Attendi la mossa dell\'avversario.');
      return;
    }

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
    // Double-check that it's the player's turn
    if (!this.isPlayerTurn()) return;

    const isCapture = Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2;
    const movingPiece = this.board[fromRow][fromCol];

    // Esegui il movimento
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


    // Promozione del re
    if (!movingPiece.isKing) {
      if ((movingPiece.pieceColor === 'white' && toRow === 0) ||
        (movingPiece.pieceColor === 'black' && toRow === 7)) {
        this.board[toRow][toCol].isKing = true;
      }
    }

    // Aggiungi la mossa
    this.moves.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: isCapture ? [{ row: fromRow + (toRow - fromRow) / 2, col: fromCol + (toCol - fromCol) / 2 }] : undefined
    });
    this.moves = [...this.moves];

    // Verifica se ci sono altre catture
    const additionalCaptures = this.getCapturesForPiece(toRow, toCol);

    // Non cambiare il turno se ci sono altre catture disponibili
    if (isCapture && additionalCaptures.length > 0) {
      this.selectedCell = { row: toRow, col: toCol };
      this.highlightedCells = additionalCaptures.map(move => move.to);
    } else {
      // Cambia turno localmente
      this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
      this.selectedCell = null;
      this.highlightedCells = [];

      if (!movingPiece.pieceColor) {
        console.error("Il pezzo non ha un colore definito");
        return;
      }
      // Invia la mossa al server
      this.moveService.saveMove({
        from: "" + this.columns[fromCol] + (8 - fromRow),
        to: "" + this.columns[toCol] + (8 - toRow),
        player: movingPiece.pieceColor!.toUpperCase() // Aggiungi il colore del giocatore (white o black)
      }, this.gameID)
        .subscribe({
          next: (response) => {
            console.log('Mossa salvata con successo', response);
            // Richiedi immediatamente lo stato aggiornato
            this.fetchGameState();
          },
          error: (error) => {
            console.error('Errore nel salvare la mossa', error);
            // Potrebbe essere necessario ripristinare lo stato precedente in caso di errore
          }
        });

      // Controlla la fine del gioco
    }
      this.checkGameOver();
  }

  /**
   * Checks if the game is over and determines the winner
   */
  checkGameOver(): void {
    // Check if a player has no pieces left
    let whiteCount = 0;
    let blackCount = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];
        if (cell.hasPiece) {
          if (cell.pieceColor === 'white') whiteCount++;
          else blackCount++;
        }
      }
    }

    this.whiteCount = whiteCount;
    this.blackCount = blackCount;

    if (whiteCount === 0) {
      this.gameOver = true;
      this.winner = 'black'; // Il nero vince se il bianco non ha pezzi
      this.showGameOverModal = true;
      return;
    }

    if (blackCount === 0) {
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
    if (this.gameOver) {
      this.gameService.deleteGame(this.gameID).subscribe(
        {
          next: () => {
            console.log('Partita eliminata con successo');
          },
          error: err => {
            console.error('Errore durante l\'eliminazione della partita', err);
          }
        });
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
