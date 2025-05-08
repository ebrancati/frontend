import {Component, EventEmitter, Inject, Output} from '@angular/core';
import { Router } from '@angular/router';
import {CommonModule, DOCUMENT} from '@angular/common';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
  imports: [CommonModule]
})
export class NavbarComponent {
  nickname = localStorage.getItem('nickname') ?? '';
  isAdmin: boolean = false;



  constructor(private router: Router,
) {}

  logout(): void {
    localStorage.removeItem('nickname');
    this.router.navigate(['/login']);
  }
  ngOnInit(): void {
    const savedNickname = localStorage.getItem('nickname');
    if (savedNickname) {
      this.nickname = savedNickname;
    }
  }
}
