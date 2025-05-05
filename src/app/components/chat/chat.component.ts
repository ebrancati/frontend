import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-chat',
  imports: [
    NgForOf,
    FormsModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messages = [
    { player: 'Player1', text: 'Pronto!' },
    { player: 'Player2', text: 'Ciao, pronto per giocare!' }
  ];
  messageInput: string = '';
  sendMessage() {
    if (this.messageInput.trim() !== '') {
      this.messages.push({ player: 'Player1', text: this.messageInput });
      this.messageInput = '';
    }
  }
}
