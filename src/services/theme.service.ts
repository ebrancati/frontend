import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<string>('light');
  public currentTheme$: Observable<string> = this.currentThemeSubject.asObservable();

  constructor() {
    // Try to load the saved theme from localStorage
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.changeTheme(savedTheme);
    } else {
      // Default to light theme
      this.changeTheme('light');
    }
  }

  public changeTheme(theme: string): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('preferredTheme', theme);
    this.currentThemeSubject.next(theme);
  }

  public getCurrentTheme(): string {
    return this.currentThemeSubject.value;
  }

  public toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.changeTheme(newTheme);
  }
}
