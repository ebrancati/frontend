import { Routes } from '@angular/router';

//import {LoginComponent} from './components/login/login.component';
//import {authGuard} from './components/guardia/auth.guard';
import {OnlineBoardComponent} from './components/online-board/online-board.component';
import {JoinComponent} from './components/join/join.component';

import {RulesContentPage} from './pages/rules-content/rules-content.page';
import {OnlinePage}       from './pages/online/online.page';
import {LocalePlayerPage} from './pages/locale-player/locale-player.page';
import {MenuPage}         from './pages/menu/menu.page';
import { LoginPage }      from './pages/login/login.page';

export const routes: Routes = [
  { path: '', redirectTo: '/play', pathMatch: 'full' },
  { path: 'play', component: MenuPage },
  { path: 'rules', component: RulesContentPage },
  { path: 'login', component: LoginPage },
  { path: 'game/:gameId', component: OnlinePage },
  { path: 'locale', component: LocalePlayerPage },
  { path: 'vs-bot', component: RulesContentPage },

  //{ path: 'board/:gameId', component: OnlineBoardComponent },
  { path: 'join/:gameId', component: JoinComponent },

  { path: '**',       redirectTo: '' },
  //{ path: 'login', component: LoginComponent },
  //{ path: 'home',     component: HomeComponent, canActivate: [authGuard] },
  //{ path: 'gamemode',    component: MenuPage },
];