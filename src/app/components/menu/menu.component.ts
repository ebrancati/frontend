import { Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {

  selectedMode: string | null = null;

  selectMode(mode: string): void {
    this.selectedMode = mode;
    console.log('Selected mode:', mode);
  }
}