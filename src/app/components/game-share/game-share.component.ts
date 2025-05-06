import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-game-share',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-share.component.html',
  styleUrls: ['./game-share.component.css']
})
export class GameShareComponent {
  @Input() gameUrl: string = 'https://test/game/uuid';
}