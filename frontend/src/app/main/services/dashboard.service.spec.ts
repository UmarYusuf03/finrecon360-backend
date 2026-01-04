import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, API_ENDPOINTS } from '../../core/constants/api.constants';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponse } from '../models/dashboard.models';

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;

  const mockResponse: DashboardSummaryResponse = {
    totalAccounts: 12,
    pendingReconciliations: 3,
    alerts: 2,
    completedToday: 5,
    lastUpdatedUtc: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns matcher stats', (done) => {
    service.getDashboardData().subscribe((data) => {
      expect(data.matcher.totalTransactions).toBe(mockResponse.totalAccounts);
      expect(data.matcher.matched).toBe(mockResponse.totalAccounts - mockResponse.alerts);
      done();
    });

    const req = httpMock.expectOne(`${API_BASE_URL}${API_ENDPOINTS.DASHBOARD.SUMMARY}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('returns analytics KPIs', (done) => {
    service.getDashboardData().subscribe((data) => {
      expect(data.analytics.length).toBeGreaterThan(0);
      expect(data.analytics[0].labelKey).toBe('Last Updated');
      done();
    });

    const req = httpMock.expectOne(`${API_BASE_URL}${API_ENDPOINTS.DASHBOARD.SUMMARY}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
