import type { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { mainRoutes } from './main/main.routes';

export const routes: Routes = [
  // Default: go to login
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },

  // Public / authentication area
  {
    path: 'auth',
    children: authRoutes,
  },

  // Main application area after login
  {
    path: 'app',
    children: mainRoutes,
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
