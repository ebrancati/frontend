import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  nickname: string = '';

  constructor(private router: Router) {}

  login() {
    if (this.nickname.trim()) {
      localStorage.setItem('nickname', this.nickname.trim());
      this.router.navigate(['/home']);
    }
  }

}