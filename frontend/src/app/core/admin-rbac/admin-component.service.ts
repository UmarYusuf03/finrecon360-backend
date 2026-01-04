import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppComponentResource } from './models';

@Injectable({
  providedIn: 'root',
})
export class AdminComponentService {
  private components$ = new BehaviorSubject<AppComponentResource[]>([
    { id: 'cmp-dashboard', code: 'DASHBOARD', name: 'Dashboard', routePath: '/app/dashboard', category: 'Analytics', description: 'Landing overview', isActive: true },
    { id: 'cmp-matcher', code: 'MATCHER', name: 'Matcher', routePath: '/app/matcher', category: 'Reconciliation', isActive: true },
    { id: 'cmp-balancer', code: 'BALANCER', name: 'Balancer', routePath: '/app/balancer', category: 'Reconciliation', isActive: true },
    { id: 'cmp-tasks', code: 'TASK_MANAGER', name: 'Task Manager', routePath: '/app/tasks', category: 'Close Tasks', isActive: true },
    { id: 'cmp-journal', code: 'JOURNAL_ENTRY', name: 'Journal Entry', routePath: '/app/journal', category: 'Accounting', isActive: true },
    { id: 'cmp-analytics', code: 'ANALYTICS', name: 'Analytics', routePath: '/app/analytics', category: 'Analytics', isActive: true },
    { id: 'cmp-users', code: 'USER_MGMT', name: 'User Management', routePath: '/app/admin/users', category: 'Admin', isActive: true },
    { id: 'cmp-roles', code: 'ROLE_MGMT', name: 'Role Management', routePath: '/app/admin/roles', category: 'Admin', isActive: true },
    { id: 'cmp-perm', code: 'PERMISSION_MGMT', name: 'Permission Management', routePath: '/app/admin/permissions', category: 'Admin', isActive: true },
  ]);

  getComponents(): Observable<AppComponentResource[]> {
    return this.components$.asObservable();
  }

  createComponent(payload: Partial<AppComponentResource>): Observable<AppComponentResource> {
    const newComponent: AppComponentResource = {
      id: `cmp-${Date.now()}-${Math.random()}`,
      code: payload.code ?? 'NEW_COMPONENT',
      name: payload.name ?? 'New component',
      routePath: payload.routePath ?? '/',
      category: payload.category,
      description: payload.description,
      isActive: true,
    };
    this.components$.next([...this.components$.value, newComponent]);
    return of(newComponent);
  }

  updateComponent(id: string, payload: Partial<AppComponentResource>): Observable<AppComponentResource> {
    const updatedList = this.components$.value.map((component) =>
      component.id === id ? { ...component, ...payload } : component
    );
    const updated = updatedList.find((c) => c.id === id)!;
    this.components$.next(updatedList);
    return of(updated);
  }

  deactivateComponent(id: string): Observable<void> {
    this.components$.next(
      this.components$.value.map((component) =>
        component.id === id ? { ...component, isActive: false } : component
      )
    );
    return of(void 0);
  }

  reactivateComponent(id: string): Observable<AppComponentResource> {
    const updatedList = this.components$.value.map((component) =>
      component.id === id ? { ...component, isActive: true } : component
    );
    const updated = updatedList.find((c) => c.id === id)!;
    this.components$.next(updatedList);
    return of(updated);
  }
}
