import { Routes } from '@angular/router';
import {MenuComponent} from './components/menu/menu.component';
import {LoginComponent} from './components/login/login.component';
import {HomeComponent} from './components/home/home.component';
import {authGuard} from './components/guardia/auth.guard';

export const routes: Routes = [
  { path: '',         redirectTo: 'menu', pathMatch: 'full' },
  { path: 'menu',    component: MenuComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'home',     component: HomeComponent, canActivate: [authGuard] },
  { path: '**',       redirectTo: '' }
];