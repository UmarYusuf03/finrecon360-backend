import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { API_BASE_URL, API_ENDPOINTS } from '../../core/constants/api.constants';
import { DashboardData, DashboardSummaryResponse } from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getDashboardData(): Observable<DashboardData> {
    return this.http
      .get<DashboardSummaryResponse>(`${API_BASE_URL}${API_ENDPOINTS.DASHBOARD.SUMMARY}`)
      .pipe(
        map((summary) => this.mapToDashboard(summary)),
        catchError((err) => throwError(() => err))
      );
  }

  private mapToDashboard(summary: DashboardSummaryResponse): DashboardData {
    const totalAccounts = summary.totalAccounts ?? 0;
    const pending = summary.pendingReconciliations ?? 0;
    const alerts = summary.alerts ?? 0;
    const completedToday = summary.completedToday ?? 0;
    const reconciledAccounts = Math.max(totalAccounts - pending, 0);
    const matcherTotal = Math.max(totalAccounts, pending);
    const matcherMatched = Math.max(matcherTotal - alerts, 0);
    const completionPercent = Math.min(
      100,
      Math.round((completedToday / Math.max(totalAccounts, 1)) * 100)
    );

    return {
      matcher: {
        totalTransactions: matcherTotal,
        matched: matcherMatched,
        exceptions: alerts,
      },
      balancer: {
        reconciledAccounts,
        totalAccounts,
        pendingReconciliations: pending,
      },
      tasks: {
        openTasks: pending,
        dueToday: alerts,
        completionPercent: Number.isFinite(completionPercent) ? completionPercent : 0,
      },
      journal: {
        pendingApprovals: alerts,
        posted: completedToday,
      },
      analytics: [
        {
          labelKey: 'Last Updated',
          value: new Date(summary.lastUpdatedUtc).toLocaleString(),
          trend: 'flat',
        },
        { labelKey: 'Completed Today', value: `${completedToday}`, trend: 'up' },
        { labelKey: 'Alerts', value: `${alerts}`, trend: alerts > 0 ? 'down' : 'up' },
      ],
    };
  }
}
