import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { CurrentUser, RoleCode } from './models';

export interface LoginCredentials {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    phoneNumber?: string | null;
    permissions: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'fr360_current_user';
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.loadFromStorage());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    const current = this.currentUserSubject.value;
    if (!current) return false;
    if (current.expiresAt && current.expiresAt < Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  updateCurrentUser(patch: Partial<CurrentUser>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated = { ...current, ...patch };
    this.currentUserSubject.next(updated);
    this.persist(updated);
  }

  login(email: string, password: string): Observable<CurrentUser> {
    const payload: LoginCredentials = { email, password };

    return this.http
      .post<BackendLoginResponse>(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, payload)
      .pipe(
        map((response) => this.mapToCurrentUser(response)),
        tap((user) => {
          this.currentUserSubject.next(user);
          this.persist(user);
        }),
        catchError((err) => {
          const message =
            err?.status === 401 || err?.status === 400
              ? 'invalid-credentials'
              : err?.error?.message || 'login-failed';
          return throwError(() => new Error(message));
        })
      );
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.storageKey);
  }

  private mapToCurrentUser(response: BackendLoginResponse): CurrentUser {
    const normalizedRole = (response.user.role ?? 'User').toUpperCase() as RoleCode;
    const expiresAt = Date.now() + (response.expiresIn ?? 0) * 1000;

    return {
      id: response.user.id,
      email: response.user.email,
      displayName: response.user.fullName || response.user.email,
      phoneNumber: response.user.phoneNumber ?? null,
      roles: [normalizedRole],
      originalRole: response.user.role,
      permissions: response.user.permissions ?? [],
      token: response.accessToken,
      expiresAt,
    };
  }

  private persist(user: CurrentUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private loadFromStorage(): CurrentUser | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as CurrentUser;
      if (user.expiresAt && user.expiresAt < Date.now()) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  }
}
