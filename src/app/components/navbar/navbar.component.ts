import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  nickname: string | null = localStorage.getItem('nickname');
  isAdmin: boolean = false;

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('nickname');
    this.router.navigate(['/login']);
  }
}
