import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { AdminUser, UserService } from '../user.service';

const ROLE_LABELS: Record<UserRole, string> = {
  reader: 'Lector',
  librarian: 'Bibliotecario',
  admin: 'Administrador',
};

const ROLES: UserRole[] = ['reader', 'librarian', 'admin'];

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container">
      <div class="header-section">
        <h2>Administración de Usuarios</h2>
        <p class="page-description">Cambia roles y activa o desactiva cuentas.</p>
      </div>

      <div class="filters-card">
        <div class="filter-group">
          <label for="search-input">Buscar por email o nombre:</label>
          <input
            id="search-input"
            type="text"
            [(ngModel)]="query"
            (keyup.enter)="applySearch()"
            placeholder="Ej: ana@correo.com"
            class="form-control"
          />
        </div>
        <div class="filter-actions">
          <button (click)="applySearch()" class="btn btn-primary" id="btn-search">
            Buscar
          </button>
          <button (click)="clearSearch()" class="btn btn-outline" id="btn-reset">
            Limpiar
          </button>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (success()) {
        <div class="alert alert-success">{{ success() }}</div>
      }

      @if (loading()) {
        <p class="loading-text">Cargando usuarios...</p>
      } @else if (users().length === 0) {
        <div class="empty-state">
          <p>No se encontraron usuarios</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="users-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <strong>{{ user.full_name }}</strong>
                    @if (user.id === currentUserId()) {
                      <span class="badge">Tú</span>
                    }
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <select
                      class="role-select"
                      (change)="changeRole(user, $event)"
                      [attr.aria-label]="'Rol de ' + user.full_name"
                    >
                      @for (role of roles; track role) {
                        <option [value]="role" [selected]="role === user.role">
                          {{ roleLabel(role) }}
                        </option>
                      }
                    </select>
                  </td>
                  <td>
                    <label class="status-toggle">
                      <input
                        type="checkbox"
                        [checked]="user.is_active"
                        (change)="toggleActive(user, $event)"
                        [attr.aria-label]="'Estado de ' + user.full_name"
                      />
                      <span>{{ user.is_active ? 'Activo' : 'Desactivado' }}</span>
                    </label>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination-bar">
          <span class="pagination-info">
            Página {{ page() }} de {{ totalPages() }} ({{ total() }} usuarios en total)
          </span>
          <div class="pagination-controls">
            <button
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
              class="btn btn-sm btn-outline"
            >
              &laquo; Anterior
            </button>
            <button
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
              class="btn btn-sm btn-outline"
            >
              Siguiente &raquo;
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .header-section {
      margin-bottom: 1.5rem;
    }
    h2 {
      color: #1e293b;
      margin-bottom: 0.25rem;
    }
    .page-description {
      color: #64748b;
    }
    .filters-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1.25rem;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1 1 280px;
    }
    label {
      color: #334155;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .form-control {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 1rem;
    }
    .form-control:focus {
      outline: 2px solid #2563eb;
      border-color: transparent;
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }
    .btn {
      border: none;
      border-radius: 6px;
      padding: 0.55rem 1rem;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-outline {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      color: #475569;
    }
    .btn-outline:hover:not(:disabled) {
      border-color: #2563eb;
      color: #2563eb;
    }
    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.85rem;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .alert {
      border-radius: 6px;
      padding: 0.65rem 0.9rem;
      margin-bottom: 1rem;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .loading-text {
      color: #64748b;
    }
    .empty-state {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }
    .table-responsive {
      overflow-x: auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .users-table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th,
    .users-table td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid #f1f5f9;
    }
    .users-table th {
      background: #f8fafc;
      color: #475569;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .users-table tr:last-child td {
      border-bottom: none;
    }
    .badge {
      display: inline-block;
      margin-left: 0.4rem;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 999px;
      padding: 0.1rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .role-select {
      padding: 0.4rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      background: #ffffff;
      font-size: 0.95rem;
    }
    .role-select:focus {
      outline: 2px solid #2563eb;
      border-color: transparent;
    }
    .status-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #475569;
      cursor: pointer;
    }
    .status-toggle input {
      width: 1rem;
      height: 1rem;
      accent-color: #2563eb;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }
  `]
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);

  readonly roles = ROLES;
  readonly currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  readonly users = signal<AdminUser[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly size = signal(10);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.size())),
  );

  query = '';

  ngOnInit(): void {
    this.load();
  }

  roleLabel(role: UserRole): string {
    return ROLE_LABELS[role];
  }

  applySearch(): void {
    this.page.set(1);
    this.load();
  }

  clearSearch(): void {
    this.query = '';
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  changeRole(user: AdminUser, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const role = select.value as UserRole;
    if (role === user.role) {
      return;
    }

    this.error.set(null);
    this.success.set(null);
    this.userService.update(user.id, { role }).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.success.set('Rol actualizado');
      },
      error: (err: HttpErrorResponse) => {
        select.value = user.role;
        this.error.set(this.errorDetail(err));
      },
    });
  }

  toggleActive(user: AdminUser, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const isActive = checkbox.checked;

    this.error.set(null);
    this.success.set(null);
    this.userService.update(user.id, { is_active: isActive }).subscribe({
      next: (updated) => {
        this.replaceUser(updated);
        this.success.set(isActive ? 'Usuario activado' : 'Usuario desactivado');
      },
      error: (err: HttpErrorResponse) => {
        checkbox.checked = user.is_active;
        this.error.set(this.errorDetail(err));
      },
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);
    this.userService.list(this.query.trim(), this.page(), this.size()).subscribe({
      next: (response) => {
        this.users.set(response.items);
        this.total.set(response.total);
        this.page.set(response.page);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.errorDetail(err));
      },
    });
  }

  private replaceUser(updated: AdminUser): void {
    this.users.update((items) =>
      items.map((user) => (user.id === updated.id ? updated : user)),
    );
  }

  private errorDetail(err: HttpErrorResponse): string {
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => String(item.msg ?? '').replace(/^Value error, /, ''))
        .filter(Boolean)
        .join('. ');
    }
    return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}
