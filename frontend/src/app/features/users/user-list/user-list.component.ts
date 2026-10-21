import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService, UserRole } from '../../../core/auth/auth.service';
import { AdminUser, UserService } from '../user.service';
import { StateComponent } from '../../../shared/state/state.component';

const ROLE_LABELS: Record<UserRole, string> = {
  reader: 'Lector',
  librarian: 'Bibliotecario',
  admin: 'Administrador',
};

const ROLES: UserRole[] = ['reader', 'librarian', 'admin'];

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StateComponent],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__title">
          <span class="page__eyebrow">Administración</span>
          <h1>Usuarios</h1>
          <p class="page__subtitle">Cambia roles y activa o desactiva cuentas de la biblioteca.</p>
        </div>
      </header>

      <section class="filters card" aria-label="Buscar usuarios">
        <div class="filters__grid">
          <div class="field">
            <label for="search-input">Buscar por correo o nombre</label>
            <input
              id="search-input"
              type="search"
              [(ngModel)]="query"
              (keyup.enter)="applySearch()"
              placeholder="Ej.: ana@correo.com"
            />
          </div>
          <div class="filters__actions">
            <button type="button" (click)="applySearch()" class="btn" id="btn-search">Buscar</button>
            <button type="button" (click)="clearSearch()" class="btn btn--secondary" id="btn-reset">
              Limpiar
            </button>
          </div>
        </div>
      </section>

      @if (error()) {
        <p class="alert alert--error" role="alert">{{ error() }}</p>
      }
      @if (success()) {
        <p class="alert alert--success" role="status">{{ success() }}</p>
      }

      @if (loading()) {
        <app-state variant="loading" title="Cargando usuarios…" />
      } @else if (users().length === 0) {
        <app-state variant="empty" title="No se encontraron usuarios" message="Prueba con otra búsqueda." />
      } @else {
        <div class="card table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
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
                  <td class="muted">{{ user.email }}</td>
                  <td>
                    <div class="role-cell">
                      <span class="badge" [class]="'badge--' + user.role">
                        {{ roleLabel(user.role) }}
                      </span>
                      <select
                        class="role-select"
                        (change)="changeRole(user, $event)"
                        [attr.aria-label]="'Cambiar el rol de ' + user.full_name"
                      >
                        @for (role of roles; track role) {
                          <option [value]="role" [selected]="role === user.role">
                            {{ roleLabel(role) }}
                          </option>
                        }
                      </select>
                    </div>
                  </td>
                  <td>
                    <label class="toggle">
                      <input
                        type="checkbox"
                        [checked]="user.is_active"
                        (change)="toggleActive(user, $event)"
                        [attr.aria-label]="'Activar o desactivar a ' + user.full_name"
                      />
                      <span class="toggle__text">{{ user.is_active ? 'Activo' : 'Desactivado' }}</span>
                    </label>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <nav class="pagination" aria-label="Paginación de usuarios">
          <span class="muted">
            Página {{ page() }} de {{ totalPages() }} · {{ total() }} usuarios
          </span>
          <div class="row">
            <button
              type="button"
              class="btn btn--sm btn--secondary"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
            >
              &laquo; Anterior
            </button>
            <button
              type="button"
              class="btn btn--sm btn--secondary"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
            >
              Siguiente &raquo;
            </button>
          </div>
        </nav>
      }
    </div>
  `,
  styles: [`
    .filters { margin-bottom: var(--space-5); }
    .filters__grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--space-4);
      align-items: end;
      padding: var(--space-5);
    }
    .filters__actions { display: flex; gap: var(--space-2); }
    .alert { margin-bottom: var(--space-4); }
    .table-wrap { overflow-x: auto; }
    .role-cell { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .role-select { padding: 0.3rem 0.5rem; border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm); background: var(--color-surface); }
    .toggle { display: inline-flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); }
    .toggle input { width: 1.1rem; height: 1.1rem; accent-color: var(--color-primary); }
    .toggle__text { color: var(--color-ink-soft); }
    .pagination {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-5);
    }
    @media (max-width: 720px) {
      .filters__grid { grid-template-columns: 1fr; }
      .filters__actions .btn { flex: 1; }
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
