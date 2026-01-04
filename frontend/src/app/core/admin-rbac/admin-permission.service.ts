import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ActionDefinition, PermissionAssignment } from './models';
import { AdminComponentService } from './admin-component.service';
import { AdminRoleService } from './admin-role.service';

@Injectable({
  providedIn: 'root',
})
export class AdminPermissionService {
  private actions: ActionDefinition[] = [
    { id: 'act-view', code: 'VIEW', name: 'ADMIN.PERMISSIONS.ACTION_VIEW' },
    { id: 'act-view-list', code: 'VIEW_LIST', name: 'ADMIN.PERMISSIONS.ACTION_VIEW_LIST' },
    { id: 'act-create', code: 'CREATE', name: 'ADMIN.PERMISSIONS.ACTION_CREATE' },
    { id: 'act-edit', code: 'EDIT', name: 'ADMIN.PERMISSIONS.ACTION_EDIT' },
    { id: 'act-delete', code: 'DELETE', name: 'ADMIN.PERMISSIONS.ACTION_DELETE' },
    { id: 'act-approve', code: 'APPROVE', name: 'ADMIN.PERMISSIONS.ACTION_APPROVE' },
    { id: 'act-manage', code: 'MANAGE', name: 'ADMIN.PERMISSIONS.ACTION_MANAGE' },
  ];

  // In-memory permission matrix (role x component x action)
  private assignments$ = new BehaviorSubject<PermissionAssignment[]>([]);

  constructor(
    private roleService: AdminRoleService,
    private componentService: AdminComponentService
  ) {
    // Seed a minimal matrix that matches current mock users.
    this.seedDefaults();
  }

  getActions(): Observable<ActionDefinition[]> {
    return of(this.actions);
  }

  getMatrix(): Observable<PermissionAssignment[]> {
    return this.assignments$.asObservable();
  }

  saveMatrix(assignments: PermissionAssignment[]): Observable<void> {
    this.assignments$.next(assignments);
    return of(void 0);
  }

  private seedDefaults(): void {
    const defaults: PermissionAssignment[] = [];
    this.roleService.getRoles().subscribe((roles) => {
      this.componentService.getComponents().subscribe((components) => {
        roles.forEach((role) => {
          components.forEach((component) => {
            // Simplified seed: give ADMIN manage on everything, accountant view on matcher/balancer/tasks.
            if (role.code === 'ADMIN') {
              defaults.push(
                ...this.actions.map((action) => ({
                  id: `${role.id}-${component.id}-${action.code}`,
                  roleId: role.id,
                  componentId: component.id,
                  actionCode: action.code,
                  permissionCode: `${component.code}.${action.code}`,
                }))
              );
            }
            if (role.code === 'ACCOUNTANT' && ['MATCHER', 'BALANCER', 'TASK_MANAGER'].includes(component.code)) {
              const viewAction = this.actions.find((a) => a.code === 'VIEW');
              if (viewAction) {
                defaults.push({
                  id: `${role.id}-${component.id}-${viewAction.code}`,
                  roleId: role.id,
                  componentId: component.id,
                  actionCode: viewAction.code,
                  permissionCode: `${component.code}.${viewAction.code}`,
                });
              }
            }
          });
        });
        this.assignments$.next(defaults);
      });
    });
  }
}
