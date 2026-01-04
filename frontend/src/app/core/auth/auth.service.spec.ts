import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((key) => delete store[key]);

    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] ?? null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps backend login response into current user', (done) => {
    service.login('admin@test.com', 'Admin@123').subscribe((user) => {
      expect(user.roles).toContain('ADMIN');
      expect(user.permissions).toContain('DASHBOARD.VIEW');
      expect(user.token).toBe('token-123');
      done();
    });

    const req = httpMock.expectOne(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);
    expect(req.request.method).toBe('POST');
    req.flush({
      accessToken: 'token-123',
      expiresIn: 3600,
      user: {
        id: 'abc',
        email: 'admin@test.com',
        fullName: 'Admin User',
        role: 'Admin',
        phoneNumber: null,
        permissions: ['DASHBOARD.VIEW'],
      },
    });
  });

  it('emits error on bad credentials', (done) => {
    service.login('bad@test.com', 'wrong').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.message).toBe('invalid-credentials');
        done();
      },
    });

    const req = httpMock.expectOne(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);
    req.flush({ message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('logout clears current user', () => {
    service.logout();
    expect(service.isAuthenticated).toBeFalse();
  });
});
