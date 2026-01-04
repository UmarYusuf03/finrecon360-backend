import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { AdminUserSummary } from './models';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private users$ = new BehaviorSubject<AdminUserSummary[]>([
    {
      id: 'user-admin',
      email: 'admin@finrecon.local',
      displayName: 'Avery Admin',
      isActive: true,
      roles: ['ADMIN'],
    },
    {
      id: 'user-accountant',
      email: 'user@finrecon.local',
      displayName: 'Alex Accountant',
      isActive: true,
      roles: ['ACCOUNTANT'],
    },
  ]);

  getUsers(): Observable<AdminUserSummary[]> {
    return this.users$.asObservable();
  }

  createUser(payload: Partial<AdminUserSummary> & { password?: string }): Observable<AdminUserSummary> {
    const newUser: AdminUserSummary = {
      id: `u-${Date.now()}-${Math.random()}`,
      email: payload.email ?? '',
      displayName: payload.displayName ?? 'New User',
      isActive: true,
      roles: payload.roles ?? [],
    };
    this.users$.next([...this.users$.value, newUser]);
    return of(newUser);
  }

  updateUser(id: string, payload: Partial<AdminUserSummary>): Observable<AdminUserSummary> {
    const updatedList = this.users$.value.map((user) =>
      user.id === id ? { ...user, ...payload } : user
    );
    const updated = updatedList.find((u) => u.id === id)!;
    this.users$.next(updatedList);
    return of(updated);
  }

  setUserRoles(id: string, roles: string[]): Observable<void> {
    this.users$.next(
      this.users$.value.map((user) =>
        user.id === id ? { ...user, roles: roles as AdminUserSummary['roles'] } : user
      )
    );
    return of(void 0);
  }

  deactivateUser(id: string): Observable<void> {
    this.users$.next(
      this.users$.value.map((user) =>
        user.id === id ? { ...user, isActive: false } : user
      )
    );
    return of(void 0);
  }

  reactivateUser(id: string): Observable<void> {
    this.users$.next(
      this.users$.value.map((user) =>
        user.id === id ? { ...user, isActive: true } : user
      )
    );
    return of(void 0);
  }
}
