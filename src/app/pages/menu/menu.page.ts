import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'page-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.css']
})
export class MenuPage {
  selectedMode: string | null = null;

  constructor(private router: Router) {}

  selectMode(mode: string): void {
    this.selectedMode = mode;

    // Naviga alle pagine appropriate in base alla modalità selezionata
    switch (mode) {
      case 'online':
        this.router.navigate(['/login']);
        break;
      case 'local':
      case 'bot':
        this.router.navigate(['/locale']);
        break;
    }

    console.log('Selected mode:', mode);
  }
}
