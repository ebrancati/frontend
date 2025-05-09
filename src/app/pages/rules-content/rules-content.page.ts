import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'page-rules-content',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './rules-content.page.html',
  styleUrl: './rules-content.page.css'
})
export class RulesContentPage {}