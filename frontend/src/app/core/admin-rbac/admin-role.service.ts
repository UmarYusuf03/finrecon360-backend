import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Role } from './models';

@Injectable({
  providedIn: 'root',
})
export class AdminRoleService {
  private roles$ = new BehaviorSubject<Role[]>([
    { id: 'r-admin', code: 'ADMIN', name: 'Administrator', description: 'Built-in admin', isSystem: true, isActive: true },
    { id: 'r-accountant', code: 'ACCOUNTANT', name: 'Accountant', description: 'Performs matching and reconciliation', isActive: true },
    { id: 'r-reviewer', code: 'REVIEWER', name: 'Reviewer', description: 'Reviews and approves journal entries', isActive: true },
    { id: 'r-manager', code: 'MANAGER', name: 'Manager', description: 'Oversees tasks and approvals', isActive: true },
    { id: 'r-auditor', code: 'AUDITOR', name: 'Auditor', description: 'Read-only oversight', isActive: true },
  ]);

  getRoles(): Observable<Role[]> {
    return this.roles$.asObservable();
  }

  createRole(payload: Partial<Role>): Observable<Role> {
    const newRole: Role = {
      id: `role-${Date.now()}-${Math.random()}`,
      code: (payload.code as Role['code']) ?? 'CUSTOM',
      name: payload.name ?? 'New role',
      description: payload.description,
      isSystem: false,
      isActive: true,
    };
    this.roles$.next([...this.roles$.value, newRole]);
    return of(newRole);
  }

  updateRole(id: string, payload: Partial<Role>): Observable<Role> {
    const updatedList = this.roles$.value.map((role) =>
      role.id === id ? { ...role, ...payload } : role
    );
    const updated = updatedList.find((r) => r.id === id)!;
    this.roles$.next(updatedList);
    return of(updated);
  }

  deactivateRole(id: string): Observable<void> {
    this.roles$.next(this.roles$.value.map((role) => (role.id === id ? { ...role, isActive: false } : role)));
    return of(void 0);
  }

  reactivateRole(id: string): Observable<Role> {
    const updatedList = this.roles$.value.map((role) =>
      role.id === id ? { ...role, isActive: true } : role
    );
    const updated = updatedList.find((r) => r.id === id)!;
    this.roles$.next(updatedList);
    return of(updated);
  }
}
