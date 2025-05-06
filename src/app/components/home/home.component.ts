import { Component } from '@angular/core';
import {HeaderComponent} from '../header/header.component';
import {BoardComponent} from '../board/board.component';
import {ContentComponent} from '../content/content.component';
import {FooterComponent} from '../footer/footer.component';
import {NavbarComponent} from "../navbar/navbar.component";

@Component({
  selector: 'app-home',
  standalone: true,
    imports: [
        HeaderComponent,
        BoardComponent,
        ContentComponent,
        FooterComponent,
        NavbarComponent
    ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'

})
export class HomeComponent {

}
