import { Routes } from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {HomeComponent} from './components/home/home.component';
import {authGuard} from './components/guardia/auth.guard';
import {ContentComponent} from './components/content/content.component';
import {MenuComponent} from './components/menu/menu.component';
import {BoardComponent} from './components/board/board.component';
import {JoinComponent} from './components/join/join.component';


export const routes: Routes = [
  { path: '',         redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'board/:gameId', component: BoardComponent },
  { path: 'join/:gameId', component: JoinComponent },
  { path: 'home',     component: HomeComponent, canActivate: [authGuard] },
  { path: 'rules',    component: ContentComponent },
  { path: 'gamemode',    component: MenuComponent },
  { path: '**',       redirectTo: '' },
];
