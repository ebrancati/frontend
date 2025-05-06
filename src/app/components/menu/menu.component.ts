import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
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
        this.router.navigate(['/home']);
        break;
    }
    
    console.log('Selected mode:', mode);
  }
}