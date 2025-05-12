import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  // Developer information
  developers = [
    {
      name: 'Enzo Brancati',
      linkedin: 'https://linkedin.com/in/enzo-brancati',
      email: 'enzo.brancati@example.com'
    },
    {
      name: 'Daniele Filareti',
      linkedin: 'https://linkedin.com/in/daniele-filareti',
      email: 'daniele.filareti@example.com'
    },
    {
      name: 'Domenico Farano',
      linkedin: 'https://linkedin.com/in/domenico-farano',
      email: 'domenico.farano@example.com'
    },
    {
      name: 'AnielloPio Pentangelo',
      linkedin: 'https://linkedin.com/in/aniello-pio-pentangelo',
      email: 'aniellopio.pentangelo@example.com'
    }
  ];
}
