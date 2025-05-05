import { Component } from '@angular/core';
import {HeaderComponent} from '../app/components/header/header.component';
import {BoardComponent} from '../app/components/board/board.component';
import { ContentComponent } from "./components/content/content.component";
import {FooterComponent} from '../app/components/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, BoardComponent, ContentComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
