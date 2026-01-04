import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { DashboardData } from '../../models/dashboard.models';
import { DashboardService } from '../../services/dashboard.service';
import { HasPermissionDirective } from '../../../core/auth/has-permission.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatCardModule, MatIconModule, HasPermissionDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  data?: DashboardData;
  errorMessage = '';
  isAdmin = false;
  canViewMatcher = false;
  canViewBalancer = false;
  canViewTasks = false;
  canViewJournal = false;
  canViewAnalytics = false;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dashboardService
      .getDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (payload) => (this.data = payload),
        error: (err) => {
          this.errorMessage =
            err?.status === 401 || err?.status === 403
              ? 'You are not authorized to view the dashboard.'
              : 'Unable to load dashboard data.';
        },
      });

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.isAdmin = !!user?.roles.includes('ADMIN');
        const permissions = user?.permissions ?? [];
        const canViewDashboard = permissions.includes('DASHBOARD.VIEW') || this.isAdmin;
        this.canViewMatcher = canViewDashboard;
        this.canViewBalancer = canViewDashboard;
        this.canViewTasks = canViewDashboard;
        this.canViewJournal = canViewDashboard;
        this.canViewAnalytics = canViewDashboard;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get matchedPercent(): number {
    if (!this.data) return 0;
    return Math.round((this.data.matcher.matched / this.data.matcher.totalTransactions) * 100);
  }

  get unmatchedPercent(): number {
    return 100 - this.matchedPercent;
  }

  get reconciledPercent(): number {
    if (!this.data) return 0;
    return Math.round(
      (this.data.balancer.reconciledAccounts / this.data.balancer.totalAccounts) * 100
    );
  }
}
