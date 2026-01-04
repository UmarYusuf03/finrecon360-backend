import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';

import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';
import { AuthService } from '../../../core/auth/auth.service';
import { CurrentUser } from '../../../core/auth/models';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LanguageSwitcherComponent,
    TranslateModule,
    HasPermissionDirective,
  ],
  templateUrl: './shell.html',
  styleUrls: ['./shell.scss'],
})
export class ShellComponent {
  user$: Observable<CurrentUser | null>;

  constructor(private authService: AuthService, private router: Router) {
    // assign here so it is initialized after DI
    this.user$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
