import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('it');
  public currentLang$: Observable<string> = this.currentLangSubject.asObservable();

  constructor(private translate: TranslateService) {
    // Imposta la lingua di default
    this.translate.setDefaultLang('it');
    
    // Cerca di caricare la lingua salvata in localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && (savedLang === 'it' || savedLang === 'en')) {
      this.changeLanguage(savedLang);
    } else {
      // Usa la lingua del browser se supportata
      const browserLang = this.translate.getBrowserLang();
      this.changeLanguage(browserLang && browserLang.match(/it|en/) ? browserLang : 'it');
    }
  }

  public changeLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('preferredLanguage', lang);
    this.currentLangSubject.next(lang);
  }

  public getCurrentLang(): string {
    return this.currentLangSubject.value;
  }
}