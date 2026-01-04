import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { API_BASE_URL, API_ENDPOINTS } from '../../core/constants/api.constants';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfileDetails } from '../models/profile.models';

interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly photoKeyPrefix = 'fr360_profile_photo_';

  constructor(private http: HttpClient, private authService: AuthService) {}

  getProfile(): Observable<UserProfileDetails> {
    return this.http
      .get<ProfileResponse>(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.ME}`)
      .pipe(
        map((resp) => this.mapProfile(resp)),
        tap((profile) => {
          const normalizedRole = (profile.role ?? 'USER').toUpperCase();
          this.authService.updateCurrentUser({
            displayName: profile.fullName,
            phoneNumber: profile.phoneNumber,
            roles: [normalizedRole],
            originalRole: profile.role,
          });
        }),
        catchError((err) => throwError(() => err))
      );
  }

  updateProfile(update: Partial<UserProfileDetails>): Observable<UserProfileDetails> {
    const payload = {
      fullName: update.fullName,
      phoneNumber: update.phoneNumber,
    };

    return this.http
      .put<ProfileResponse>(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.ME}`, payload)
      .pipe(
        map((resp) => this.mapProfile(resp)),
        tap((profile) =>
          this.authService.updateCurrentUser({
            displayName: profile.fullName,
            phoneNumber: profile.phoneNumber,
          })
        ),
        catchError((err) => throwError(() => err))
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http
      .post(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.CHANGE_PASSWORD}`, {
        currentPassword,
        newPassword,
      })
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }

  deleteAccount(): Observable<void> {
    return this.http
      .delete(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.DELETE}`)
      .pipe(
        map(() => void 0),
        catchError((err) => throwError(() => err))
      );
  }

  getProfilePhoto(userId: string): string | null {
    return localStorage.getItem(this.photoKeyPrefix + userId);
  }

  saveProfilePhoto(userId: string, dataUrl: string): void {
    localStorage.setItem(this.photoKeyPrefix + userId, dataUrl);
    // TODO: POST /api/profile/me/photo (not implemented yet)
  }

  clearProfilePhoto(userId: string): void {
    localStorage.removeItem(this.photoKeyPrefix + userId);
  }

  private mapProfile(resp: ProfileResponse): UserProfileDetails {
    const existingPhoto = resp.id ? this.getProfilePhoto(resp.id) : null;
    return {
      id: resp.id,
      fullName: resp.fullName,
      email: resp.email,
      role: resp.role,
      phoneNumber: resp.phoneNumber,
      photoDataUrl: existingPhoto,
    };
  }
}
