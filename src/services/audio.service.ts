// audio.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private moveSound: HTMLAudioElement;
  private captureSound: HTMLAudioElement;
  private winSound: HTMLAudioElement;
  private loseSound: HTMLAudioElement;

  constructor() {
    this.moveSound = new Audio('assets/sounds/move.mp3');
    this.captureSound = new Audio('assets/sounds/capture.mp3');
    this.winSound = new Audio('assets/sounds/win.mp3');
    this.loseSound = new Audio('assets/sounds/lose.mp3');
  }

  playMoveSound(): void {
    this.moveSound.play();
  }

  playCaptureSound(): void {
    this.captureSound.play();
  }

  playWinSound(): void {
    this.winSound.play();
  }

  playLoseSound(): void {
    this.loseSound.play();
  }
}
