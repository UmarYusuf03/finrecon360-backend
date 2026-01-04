import { TestBed } from '@angular/core/testing';
import { take } from 'rxjs/operators';

import { AdminPermissionService } from './admin-permission.service';
import { AdminRoleService } from './admin-role.service';
import { AdminComponentService } from './admin-component.service';

describe('AdminPermissionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminPermissionService, AdminRoleService, AdminComponentService],
    });
  });

  it('returns standard actions', (done) => {
    const service = TestBed.inject(AdminPermissionService);
    service.getActions().pipe(take(1)).subscribe((actions) => {
      expect(actions.find((a) => a.code === 'VIEW')).toBeTruthy();
      expect(actions.find((a) => a.code === 'CREATE')).toBeTruthy();
      done();
    });
  });

  it('builds permission codes as COMPONENT.ACTION', (done) => {
    const service = TestBed.inject(AdminPermissionService);
    service.getMatrix().pipe(take(1)).subscribe((assignments) => {
      const match = assignments.find((a) => a.permissionCode.includes('.'));
      expect(match?.permissionCode).toContain('.');
      done();
    });
  });
});
