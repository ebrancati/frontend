import { NgClass, NgForOf, NgIf } from '@angular/common';
import { OnlineMovesComponent as MovesComponent } from '../online-moves/online-moves.component';
import { ChatComponent } from '../chat/chat.component';
import { MoveServiceService } from '../../../services/move-service.service';
import { GameService } from '../../../services/game.service';
import { ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import {MoveP} from '../../../model/entities/MoveP';
import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import { AudioService } from '../../../services/audio.service';

export interface PlayerDto {
  id: string;
  nickname: string;
  team: 'WHITE' | 'BLACK';
}

export interface GameResponse {
  cronologiaMosse: string[];
  chat: string;
  id: string;
  board: string[][];
  turno: 'WHITE' | 'BLACK' | 'NONE';
  pedineW: number;
  pedineB: number;
  damaW: number;
  damaB: number;
  partitaTerminata: boolean;
  vincitore: 'WHITE' | 'BLACK' | 'NONE';
  players: PlayerDto[];
}

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
  // Proprietà per gestire la cattura multipla
  isCapturingMultiple: boolean = false;
  lastCapturePosition: { row: number; col: number } | null = null;
  waitingForNextCapture: boolean = false;

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
  nickname: string | null = localStorage.getItem('nickname');
  lastProcessedMoveCount: number = 0;
  protected chatHistory: string='';
  linkCopied: boolean = false;

  constructor(
    private moveService: MoveServiceService,
    private gameService: GameService,
    private route: ActivatedRoute,
    private audioService: AudioService,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.origin = this.document.location.origin;
  }

  ngOnInit() {
    this.gameID = this.route.snapshot.paramMap.get('gameId')!;
    this.initBoard();
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  startPolling() {
    this.fetchGameState();
    this.pollingSubscription = interval(2000).subscribe(() => {
      if (!this.isCapturingMultiple) {
        this.fetchGameState();
      }
    });
  }

  fetchGameState() {
    if (!this.gameID) return;

    this.gameService.getGameState(this.gameID).subscribe({
      next: (response: GameResponse) => {
        // Aggiorna sempre la chat history, anche durante una cattura multipla
        this.chatHistory = response.chat ?? '';

        if (this.isCapturingMultiple) {
          console.log('Ignorando aggiornamento di stato durante cattura multipla');
          return;
        }

        console.log('Game state response:', response);

        const nickname = localStorage.getItem('nickname');
        console.log('Nickname corrente in localStorage:', nickname);

        if (nickname) {
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

        for (const player of response.players) {
          if (player.team === 'WHITE') {
            this.whitePlayerNickname = player.nickname;
          } else if (player.team === 'BLACK') {
            this.blackPlayerNickname = player.nickname;
          }
        }

        this.updateGameState(response);

        if (response.cronologiaMosse && Array.isArray(response.cronologiaMosse)) {
          this.updateMovesFromHistory(response.cronologiaMosse);
        }

        // Verifica se siamo in una situazione di cattura multipla
        // Se il turno è ancora nostro dopo un'ultima mossa di cattura
        if (this.waitingForNextCapture && this.isPlayerTurn()) {
          console.log('Rilevata possibile cattura multipla - turno ancora del giocatore');
          this.isCapturingMultiple = true;
          // Preseleziona automaticamente la pedina che ha appena catturato
          if (this.lastCapturePosition) {
            console.log('Selezionando automaticamente la pedina in posizione:', this.lastCapturePosition);
            this.selectCell(this.lastCapturePosition.row, this.lastCapturePosition.col);
          }
        } else {
          this.waitingForNextCapture = false;
          this.isCapturingMultiple = false;
          this.lastCapturePosition = null;
        }
      },
      error: (error) => {
        console.error('Errore nel recupero dello stato del gioco:', error);
      }
    });
  }


  updateMovesFromHistory(moveHistory: string[]): void {
    this.moves = [];

    for (const moveString of moveHistory) {
      const parts = moveString.split('-');
      if (parts.length < 3) continue;

      const fromRow = parseInt(parts[0][0]);
      const fromCol = parseInt(parts[0][1]);
      const toRow = parseInt(parts[1][0]);
      const toCol = parseInt(parts[1][1]);

      const isCapture = Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2;

      const move: Move = {
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol }
      };

      if (isCapture) {
        const capturedRow = Math.floor((fromRow + toRow) / 2);
        const capturedCol = Math.floor((fromCol + toCol) / 2);
        move.captured = [{ row: capturedRow, col: capturedCol }];
      }

      this.moves.push(move);
    }
  }

  updateGameState(response: GameResponse) {
    this.currentPlayer = response.turno === 'WHITE' ? 'white' : 'black';
    this.updateBoardFromState(response.board);
    this.whiteCount = response.pedineW + response.damaW;
    this.blackCount = response.pedineB + response.damaB;
    this.gameOver = response.partitaTerminata;

    if (this.gameOver && response.vincitore !== 'NONE') {
      if (this.pollingSubscription) {
        this.pollingSubscription.unsubscribe();
        this.pollingSubscription = null;
      }

      this.winner = response.vincitore === 'WHITE' ? 'white' : 'black';
      if (this.playerTeam === response.vincitore) {
        this.audioService.playWinSound();
      } else {
        this.audioService.playLoseSound();
      }

      this.gameService.deleteGame(this.gameID).subscribe({
        next: () => {
          console.log('Partita eliminata con successo');
          this.showGameOverModal = true;
        },
        error: (err) => {
          console.error('Errore nell\'eliminazione della partita:', err);
          this.showGameOverModal = true;
        }
      });
    }

    console.log(`Stato aggiornato: Turno ${this.currentPlayer}, Team giocatore: ${this.playerTeam}`);
  }

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

  isPlayerTurn(): boolean {
    if (!this.playerTeam) return false;

    const isPlayerTurn = (this.playerTeam === 'WHITE' && this.currentPlayer === 'white') ||
                          (this.playerTeam === 'BLACK' && this.currentPlayer === 'black');

    return isPlayerTurn;
  }

  initBoard() {
    // Inizializza la scacchiera vuota 8x8
    this.board = Array(8).fill(0).map(() =>
      Array(8).fill(0).map(() => ({
        hasPiece: false,
        pieceColor: null,
        isKing: false
      }))
    );
  }

  // Metodo per verificare se una cella è evidenziata (valida per la mossa)
  isHighlighted(row: number, col: number): boolean {
    return this.highlightedCells.some(cell => cell.row === row && cell.col === col);
  }

  // Metodo chiamato quando si clicca su una cella
  selectCell(row: number, col: number) {
    // Non consentire mosse se non è il turno del giocatore o se la partita è terminata
    if (!this.isPlayerTurn() || this.gameOver) {
      return;
    }

    const cell = this.board[row][col];
    const isPlayerWhite = this.playerTeam === 'WHITE';

    console.log('Cella selezionata:', row, col, 'isCapturingMultiple:', this.isCapturingMultiple);

    // Se è in corso una cattura multipla, gestisci in modo specifico
    if (this.isCapturingMultiple && this.lastCapturePosition) {
      console.log('Cattura multipla in corso, ultima posizione:', this.lastCapturePosition);

      // Se stiamo selezionando una cella diversa dalla pedina che ha appena catturato
      if (row !== this.lastCapturePosition.row || col !== this.lastCapturePosition.col) {
        // Se la cella è una destinazione valida (è evidenziata), allora permetti la mossa
        if (this.isHighlighted(row, col)) {
          console.log('Muovendo verso una cella evidenziata in cattura multipla');
          this.makeMove(this.lastCapturePosition.row, this.lastCapturePosition.col, row, col);
          return;
        } else {
          console.log('In cattura multipla: puoi muovere solo la pedina che ha appena catturato');
          return;
        }
      } else {
        // Stiamo selezionando la stessa pedina che ha appena catturato
        this.selectedCell = { row, col };
        // Calcola solo le mosse di cattura per questa pedina
        this.highlightCaptureMovesForMultipleCapture(row, col, cell.pieceColor === 'white', cell.isKing);
        return;
      }
    }

    // Verifica se ci sono mosse di cattura obbligatorie nel gioco
    const allPossibleCaptures = this.findAllPossibleCaptures(isPlayerWhite);

    // Se il giocatore ha già selezionato una cella
    if (this.selectedCell) {
      // Se si clicca sulla stessa cella, deselezionala
      if (this.selectedCell.row === row && this.selectedCell.col === col) {
        this.selectedCell = null;
        this.highlightedCells = [];
        return;
      }

      // Se si clicca su una cella vuota evidenziata, effettua una mossa
      if (!cell.hasPiece && this.isHighlighted(row, col)) {
        this.makeMove(this.selectedCell.row, this.selectedCell.col, row, col);
        return;
      }

      // Se si clicca su un'altra pedina, cambia selezione
      if (cell.hasPiece) {
        const isPieceCurrentPlayer = (cell.pieceColor === 'white' && isPlayerWhite) ||
                                  (cell.pieceColor === 'black' && !isPlayerWhite);

        if (isPieceCurrentPlayer) {
          // Se ci sono catture obbligatorie, verifica se questa pedina può catturare
          if (allPossibleCaptures.length > 0) {
            const canThisPieceCapture = allPossibleCaptures.some(capture =>
              capture.piece.row === row && capture.piece.col === col
            );

            if (canThisPieceCapture) {
              this.selectedCell = { row, col };
              this.highlightValidMoves(row, col, cell.pieceColor === 'white', cell.isKing);
            } else {
              // Non selezionare pedine che non possono catturare se ci sono catture obbligatorie
              console.log('Questa pedina non può catturare. Seleziona una pedina che può catturare.');
            }
          } else {
            // Se non ci sono catture obbligatorie, seleziona normalmente
            this.selectedCell = { row, col };
            this.highlightValidMoves(row, col, cell.pieceColor === 'white', cell.isKing);
          }
        }
        return;
      }
    }

    // Seleziona una nuova pedina solo se appartiene al giocatore corrente
    if (cell.hasPiece &&
        ((cell.pieceColor === 'white' && isPlayerWhite) ||
         (cell.pieceColor === 'black' && !isPlayerWhite))) {

      // Se ci sono catture obbligatorie, verifica se questa pedina può catturare
      if (allPossibleCaptures.length > 0) {
        const canThisPieceCapture = allPossibleCaptures.some(capture =>
          capture.piece.row === row && capture.piece.col === col
        );

        if (canThisPieceCapture) {
          this.selectedCell = { row, col };
          this.highlightValidMoves(row, col, cell.pieceColor === 'white', cell.isKing);
        } else {
          // Non selezionare pedine che non possono catturare se ci sono catture obbligatorie
          console.log('Questa pedina non può catturare. Seleziona una pedina che può catturare.');
        }
      } else {
        // Se non ci sono catture obbligatorie, seleziona normalmente
        this.selectedCell = { row, col };
        this.highlightValidMoves(row, col, cell.pieceColor === 'white', cell.isKing);
      }
    } else {
      this.selectedCell = null;
      this.highlightedCells = [];
    }
  }

  // Aggiungi questo nuovo metodo per evidenziare solo le mosse di cattura durante una cattura multipla
  highlightCaptureMovesForMultipleCapture(row: number, col: number, isWhite: boolean, isKing: boolean) {
    this.highlightedCells = [];

    // Trova solo le mosse di cattura
    const captureMoves = this.findCaptureMoves(row, col, isWhite, isKing);
    this.highlightedCells = captureMoves;

    console.log('Mosse di cattura disponibili durante cattura multipla:', captureMoves);
  }

  // Correzione del metodo highlightValidMoves per le regole della dama italiana
  highlightValidMoves(row: number, col: number, isWhite: boolean, isKing: boolean) {
    this.highlightedCells = [];

    // Verifica se ci sono mosse di cattura disponibili per qualsiasi pedina del giocatore corrente
    const allPlayerCaptures = this.findAllPossibleCaptures(isWhite);

    // Se ci sono catture possibili nel gioco, il giocatore è obbligato a catturare
    if (allPlayerCaptures.length > 0) {
      // Trova la pedina selezionata nell'elenco delle pedine che possono catturare
      const selectedPieceCaptures = allPlayerCaptures.find(item =>
        item.piece.row === row && item.piece.col === col
      );

      // Se questa pedina specifica può catturare, mostra le sue mosse di cattura
      if (selectedPieceCaptures) {
        this.highlightedCells = selectedPieceCaptures.moves;
        console.log('Mosse di cattura disponibili per questa pedina:', selectedPieceCaptures.moves);
      } else {
        // Questa pedina non può catturare, mentre altre pedine possono
        // In questo caso, non mostrare mosse possibili (obbligo di cattura)
        console.log('Questa pedina non può catturare, ma altre sì. Seleziona una pedina che può catturare.');
        this.highlightedCells = [];
      }
      return;
    }

    // Se non ci sono mosse di cattura obbligatorie, mostra le mosse normali
    // Direzioni di movimento
    const directions = isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] // La Dama può muoversi in tutte le direzioni (ma solo una casella)
      : isWhite
        ? [[-1, -1], [-1, 1]] // Pedina bianca va verso l'alto
        : [[1, -1], [1, 1]];  // Pedina nera va verso il basso

    // Cerca mosse normali
    for (const [dr, dc] of directions) {
      // Nella dama italiana, sia le pedine che le dame si muovono di una sola casella
      // La differenza è che le dame possono muoversi in tutte le direzioni
      const newRow = row + dr;
      const newCol = col + dc;

      // Controlla se la nuova posizione è all'interno della scacchiera
      if (newRow >= 0 && newRow <= 7 && newCol >= 0 && newCol <= 7) {
        // Controlla se la cella è vuota
        if (!this.board[newRow][newCol].hasPiece) {
          this.highlightedCells.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  // Correzione del metodo findCaptureMoves per le regole della dama italiana
  findCaptureMoves(row: number, col: number, isWhite: boolean, isKing: boolean): { row: number, col: number }[] {
    const captureMoves: { row: number, col: number }[] = [];

    // Tutte le direzioni diagonali
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    // Per le pedine normali, limitiamo la direzione in base al colore (solo in avanti)
    const normalPieceDirections = isWhite
      ? [[-1, -1], [-1, 1]] // Pedina bianca va verso l'alto
      : [[1, -1], [1, 1]];  // Pedina nera va verso il basso

    // Usa le direzioni appropriate in base al tipo di pedina
    // Nella dama italiana, la dama può muoversi in tutte le direzioni ma solo di una casella alla volta
    const applicableDirections = isKing ? directions : normalPieceDirections;

    for (const [dr, dc] of applicableDirections) {
      // Per la dama italiana, le regole di cattura sono simili per dame e pedine normali
      // La differenza è che la dama può catturare in tutte le direzioni
      const midRow = row + dr;
      const midCol = col + dc;
      const landRow = row + 2 * dr;
      const landCol = col + 2 * dc;

      // Controlla se la posizione di atterraggio è all'interno della scacchiera
      if (landRow >= 0 && landRow <= 7 && landCol >= 0 && landCol <= 7) {
        // Controlla se c'è una pedina avversaria in mezzo
        if (this.board[midRow][midCol].hasPiece &&
            ((isWhite && this.board[midRow][midCol].pieceColor === 'black') ||
             (!isWhite && this.board[midRow][midCol].pieceColor === 'white')) &&
            !this.board[landRow][landCol].hasPiece) {
          // Aggiungi la mossa di cattura
          captureMoves.push({ row: landRow, col: landCol });
        }
      }
    }

    return captureMoves;
  }

  // Versione corretta di findAllPossibleCaptures per la dama italiana
  findAllPossibleCaptures(isWhitePlayer: boolean): { piece: { row: number, col: number }, moves: { row: number, col: number }[] }[] {
    const result: { piece: { row: number, col: number }, moves: { row: number, col: number }[] }[] = [];

    // Controlla ogni cella della scacchiera
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = this.board[r][c];

        // Verifica che ci sia una pedina del giocatore corrente
        if (cell.hasPiece) {
          const isPieceWhite = cell.pieceColor === 'white';

          // Assicurati che sia una pedina del giocatore corrente
          if ((isWhitePlayer && isPieceWhite) || (!isWhitePlayer && !isPieceWhite)) {
            // Trova le mosse di cattura per questa pedina
            const captureMoves = this.findCaptureMoves(r, c, isPieceWhite, cell.isKing);

            // Se questa pedina può fare catture, aggiungi all'elenco
            if (captureMoves.length > 0) {
              result.push({
                piece: { row: r, col: c },
                moves: captureMoves
              });
            }
          }
        }
      }
    }

    // Nella dama italiana, se una dama può catturare, essa ha la priorità sulle pedine normali
    const damaCatture = result.filter(item =>
      this.board[item.piece.row][item.piece.col].isKing
    );

    if (damaCatture.length > 0) {
      return damaCatture;
    }

    return result;
  }

  // Modificare makeMove per seguire le regole della dama italiana
  makeMove(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    // Calcola se è una mossa di cattura (sempre 2 caselle di distanza nella dama italiana)
    const isCapture = Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2;
    const isKing = this.board[fromRow][fromCol].isKing;

    // Trova le pedine catturate se è una mossa di cattura
    const capturedPieces: { row: number, col: number }[] = [];
    if (isCapture) {
      // Nella dama italiana, sia le pedine che le dame catturano saltando nella casella immediatamente successiva
      const capturedRow = Math.floor((fromRow + toRow) / 2);
      const capturedCol = Math.floor((fromCol + toCol) / 2);
      capturedPieces.push({ row: capturedRow, col: capturedCol });

      // Se cattura, imposta flag per possibile cattura multipla
      this.lastCapturePosition = { row: toRow, col: toCol };
    }

    // Invia la mossa al server
    this.sendMoveToServer(fromRow, fromCol, toRow, toCol);
  }

  // Modificare sendMoveToServer per seguire le regole della dama italiana
  sendMoveToServer(fromRow: number, fromCol: number, toRow: number, toCol: number) {
    const moveDto: MoveP = {
      from: `${fromRow}${fromCol}`,
      to: `${toRow}${toCol}`,
      player: this.playerTeam || ''
    };

    // Flag per indicare che stiamo aspettando una risposta per cattura multipla
    const isCapture = Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2;

    if (isCapture) {
      this.waitingForNextCapture = true;
      // Memorizza la posizione finale per la prossima mossa di cattura
      this.lastCapturePosition = {row: toRow, col: toCol};
    }

    // Blocca temporaneamente il polling durante l'invio della mossa
    const wasCapturing = this.isCapturingMultiple;
    this.isCapturingMultiple = true;

    this.moveService.saveMove(moveDto, this.gameID).subscribe({
      next: (response: GameResponse) => {
        console.log('Mossa inviata con successo:', response);

        // Riproduci il suono della mossa
        if (isCapture) {
          this.audioService.playCaptureSound();
        } else {
          this.audioService.playMoveSound();
        }

        // Aggiorna lo stato della partita dopo la mossa
        this.updateGameState(response);

        if (response.cronologiaMosse) {
          this.updateMovesFromHistory(response.cronologiaMosse);
        }

        // Gestione della cattura multipla - verifica se siamo ancora noi a giocare
        if (isCapture && this.isPlayerTurn()) {
          console.log('Cattura multipla possibile: stesso turno dopo cattura');
          this.isCapturingMultiple = true;

          // Nella dama italiana, la pedina diventa dama se raggiunge l'ultima riga
          const becameKing =
            (!this.board[fromRow][fromCol].isKing &&
              ((this.playerTeam === 'WHITE' && toRow === 0) ||
                (this.playerTeam === 'BLACK' && toRow === 7)));

          // Se la pedina è appena diventata dama, non può continuare a catturare
          if (becameKing) {
            console.log('Pedina diventata dama: fine del turno');
            this.waitingForNextCapture = false;
            this.isCapturingMultiple = false;
            this.lastCapturePosition = null;
            this.selectedCell = null;
            this.highlightedCells = [];
          } else {
            // Controlla se ci sono altre mosse di cattura possibili
            // Ottieni l'informazione aggiornata se la pedina è una dama
            const updatedCell = response.board[toRow][toCol];
            const isNowKing = updatedCell === 'W' || updatedCell === 'B';

            const captureMoves = this.findCaptureMoves(
              toRow, toCol,
              this.board[toRow][toCol].pieceColor === 'white',
              isNowKing
            );

            if (captureMoves.length > 0) {
              console.log('Altre mosse di cattura disponibili:', captureMoves);
              // Seleziona automaticamente la pedina per la prossima mossa
              this.selectedCell = {row: toRow, col: toCol};
              this.highlightedCells = captureMoves;
            } else {
              console.log('Nessuna cattura multipla: fine delle catture possibili');
              this.waitingForNextCapture = false;
              this.isCapturingMultiple = false;
              this.lastCapturePosition = null;
              this.selectedCell = null;
              this.highlightedCells = [];
            }
          }
        } else {
          console.log('Nessuna cattura multipla: turno passato o fine delle catture');
          this.waitingForNextCapture = false;
          this.isCapturingMultiple = false;
          this.lastCapturePosition = null;
          this.selectedCell = null;
          this.highlightedCells = [];
        }

        // Ripristina il polling se necessario
        setTimeout(() => {
          if (!this.isCapturingMultiple) {
            this.fetchGameState();
          }
        }, 500);
      },
      error: (error) => {
        console.error('Errore nell\'invio della mossa:', error);
        this.isCapturingMultiple = wasCapturing;
        this.waitingForNextCapture = false;
        this.fetchGameState();
      }
    });
  }

  // Metodi per lo stile delle celle
  // Metodo per verificare se una cella appartiene alla classe light o dark
  // Metodo per verificare se una cella appartiene alla classe light o dark
  getCellClass(row: number, col: number): string {
    // Importante: verifica se (row + col) è pari o dispari
    const isLightSquare = (row + col) % 2 === 0;

    // Assegna le classi corrette (white-cell o black-cell)
    let classes = isLightSquare ? 'white-cell' : 'black-cell';

    // Aggiungi classe highlighted-cell se la cella è una mossa valida
    if (this.isHighlighted(row, col)) {
      classes += ' highlighted-cell';
    }

    // Aggiungi classe selected-cell se la cella è selezionata
    if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
      classes += ' selected-cell';
    }

    return classes;
  }




// Metodo per verificare se la partita ha bisogno di un avversario
  needsOpponent(): boolean {
    // La partita ha bisogno di un avversario se uno dei nickname è ancora quello di default
    return this.whitePlayerNickname === 'Giocatore Bianco' ||
      this.blackPlayerNickname === 'Giocatore Nero';
  }

// Metodo per copiare il link negli appunti
  copyToClipboard(gameLink: HTMLInputElement): void {
    gameLink.select();
    document.execCommand('copy');
    this.linkCopied = true;

    // Nascondi il messaggio di conferma dopo 3 secondi
    setTimeout(() => {
      this.linkCopied = false;
    }, 3000);
  }

// Metodo per nascondere il modale di fine partita
  hideGameOverModal(): void {
    this.showGameOverModal = false;
  }

// Metodo per iniziare una nuova partita
  resetGame(): void {
    // Chiudi la modale
    this.hideGameOverModal();

    // Reindirizza alla pagina principale o di creazione nuova partita
    window.location.href = this.origin + '/new-game';
  }
};
