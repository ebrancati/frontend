import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  standalone: true,
  imports: [CommonModule, TranslateModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  nickname = localStorage.getItem('nickname') ?? '';
  isAdmin: boolean = false;
  currentLang: string = 'it';
  private langSubscription: Subscription;

  constructor(
    private router: Router,
    private languageService: LanguageService
  ) {
    this.langSubscription = this.languageService.currentLang$.subscribe(
      lang => this.currentLang = lang
    );
  }

  ngOnInit(): void {
    const savedNickname = localStorage.getItem('nickname');
    if (savedNickname) {
      this.nickname = savedNickname;
    }
  }

  ngOnDestroy(): void {
    if (this.langSubscription) {
      this.langSubscription.unsubscribe();
    }
  }

  logout(): void {
    localStorage.removeItem('nickname');
    this.router.navigate(['/login']);
  }

  changeLanguage(lang: string): void {
    this.languageService.changeLanguage(lang);
  }
}