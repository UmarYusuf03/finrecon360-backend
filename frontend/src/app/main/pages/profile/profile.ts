import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import { UserProfileDetails } from '../../models/profile.models';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslateModule,
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  currentProfile?: UserProfileDetails;
  isAdmin = false;
  saveMessage = '';
  passwordMessage = '';
  errorMessage = '';
  photoPreview: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      role: [{ value: '', disabled: true }],
      phoneNumber: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });

    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProfile(): void {
    this.profileService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => this.setForm(profile),
        error: (err) => {
          this.errorMessage = err?.status === 401 ? 'You are not authorized.' : 'Unable to load profile.';
        },
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.currentProfile) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saveMessage = '';
    this.errorMessage = '';

    const payload = {
      fullName: this.profileForm.get('fullName')?.value,
      phoneNumber: this.isAdmin
        ? undefined
        : this.profileForm.get('phoneNumber')?.value || null,
    };

    this.profileService
      .updateProfile(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.currentProfile = updated;
          this.saveMessage = 'Profile updated.';
          if (this.isAdmin) {
            this.profileForm.get('phoneNumber')?.disable({ emitEvent: false });
          }
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Unable to update profile.';
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordMessage = 'New password and confirmation do not match.';
      return;
    }

    this.passwordMessage = '';
    this.errorMessage = '';

    this.profileService
      .changePassword(currentPassword, newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.passwordMessage = 'Password updated successfully.';
          this.passwordForm.reset();
        },
        error: (err) => {
          if (err?.status === 403) {
            this.errorMessage = 'Only non-admin users can change password.';
          } else if (err?.status === 400) {
            this.errorMessage = err?.error?.message || 'Current password is incorrect.';
          } else {
            this.errorMessage = 'Unable to change password.';
          }
        },
      });
  }

  deleteAccount(): void {
    if (!this.currentProfile) return;
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;

    this.profileService
      .deleteAccount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.profileService.clearProfilePhoto(this.currentProfile!.id);
          this.authService.logout();
          this.router.navigateByUrl('/auth/login');
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Unable to delete account.';
        },
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length || !this.currentProfile) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.photoPreview = base64;
      this.profileService.saveProfilePhoto(this.currentProfile!.id, base64);
    };
    reader.readAsDataURL(file);
  }

  private setForm(profile: UserProfileDetails): void {
    this.currentProfile = profile;
    this.isAdmin = profile.role?.toUpperCase() === 'ADMIN';
    this.photoPreview = profile.photoDataUrl ?? null;

    this.profileForm.patchValue({
      fullName: profile.fullName,
      email: profile.email,
      role: profile.role,
      phoneNumber: profile.phoneNumber,
    });

    if (this.isAdmin) {
      this.profileForm.get('phoneNumber')?.disable({ emitEvent: false });
    } else {
      this.profileForm.get('phoneNumber')?.enable({ emitEvent: false });
    }
  }
}
