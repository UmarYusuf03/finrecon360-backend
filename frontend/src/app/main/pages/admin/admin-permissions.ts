import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';

import { AdminPermissionService } from '../../../core/admin-rbac/admin-permission.service';
import { AdminComponentService } from '../../../core/admin-rbac/admin-component.service';
import { AdminRoleService } from '../../../core/admin-rbac/admin-role.service';
import {
  ActionDefinition,
  AppComponentResource,
  PermissionAssignment,
  Role,
} from '../../../core/admin-rbac/models';

@Component({
  selector: 'app-admin-permissions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './admin-permissions.html',
  styleUrls: ['./admin-permissions.scss'],
})
export class AdminPermissionsComponent implements OnInit {
  roles: Role[] = [];
  components: AppComponentResource[] = [];
  actions: ActionDefinition[] = [];
  assignments: PermissionAssignment[] = [];
  displayedColumns: string[] = ['component'];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private permissionService: AdminPermissionService,
    private roleService: AdminRoleService,
    private componentService: AdminComponentService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      roleId: [''],
      search: [''],
    });

    this.roleService.getRoles().subscribe((roles) => {
      this.roles = roles;
      if (roles.length) {
        this.form.get('roleId')?.setValue(roles[0].id);
      }
    });

    this.componentService.getComponents().subscribe((components) => (this.components = components));
    this.permissionService.getActions().subscribe((actions) => {
      this.actions = actions;
      this.displayedColumns = ['component', ...actions.map((a) => a.code)];
    });
    this.permissionService.getMatrix().subscribe((assignments) => (this.assignments = assignments));
  }

  filteredComponents(): AppComponentResource[] {
    const search = (this.form.get('search')?.value || '').toLowerCase();
    if (!search) return this.components;
    return this.components.filter((c) => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search));
  }

  isChecked(componentId: string, actionCode: string): boolean {
    const roleId = this.form.get('roleId')?.value;
    return this.assignments.some(
      (a) => a.roleId === roleId && a.componentId === componentId && a.actionCode === actionCode
    );
  }

  toggle(component: AppComponentResource, action: ActionDefinition): void {
    const roleId = this.form.get('roleId')?.value;
    if (!roleId) return;

    const existingIndex = this.assignments.findIndex(
      (a) =>
        a.roleId === roleId &&
        a.componentId === component.id &&
        a.actionCode === action.code
    );

    if (existingIndex >= 0) {
      // remove
      this.assignments = this.assignments.filter((_, idx) => idx !== existingIndex);
    } else {
      // add
      this.assignments = [
        ...this.assignments,
        {
          id: `${roleId}-${component.id}-${action.code}`,
          roleId,
          componentId: component.id,
          actionCode: action.code,
          permissionCode: `${component.code}.${action.code}`,
        },
      ];
    }
  }

  save(): void {
    this.permissionService.saveMatrix(this.assignments).subscribe();
  }
}
