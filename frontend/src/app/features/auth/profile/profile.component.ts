import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService, UserProfile } from '../../../core/auth/auth.service';

const ROLE_LABELS: Record<UserProfile['role'], string> = {
  reader: 'Lector',
  librarian: 'Bibliotecario',
  admin: 'Administrador',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-container">
      <h2>Mi perfil</h2>

      <p class="loading" *ngIf="loading()">Cargando perfil…</p>
      <p class="form-error" role="alert" *ngIf="error()">{{ error() }}</p>

      <dl class="profile-card" *ngIf="profile() as user">
        <div class="profile-row">
          <dt>Correo electrónico</dt>
          <dd>{{ user.email }}</dd>
        </div>
        <div class="profile-row">
          <dt>Nombre completo</dt>
          <dd>{{ user.full_name }}</dd>
        </div>
        <div class="profile-row">
          <dt>Rol</dt>
          <dd>{{ roleLabel(user.role) }}</dd>
        </div>
        <div class="profile-row">
          <dt>Estado</dt>
          <dd [class.active]="user.is_active" [class.disabled]="!user.is_active">
            {{ user.is_active ? 'Activa' : 'Desactivada' }}
          </dd>
        </div>
      </dl>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 640px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    h2 {
      color: #1e293b;
      margin-bottom: 1rem;
    }
    .loading {
      color: #64748b;
    }
    .form-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 0.6rem 0.75rem;
      font-size: 0.95rem;
    }
    .profile-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      margin: 0;
      padding: 0.5rem 1.5rem;
    }
    .profile-row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.9rem 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .profile-row:last-child {
      border-bottom: none;
    }
    dt {
      color: #64748b;
      font-weight: 500;
    }
    dd {
      margin: 0;
      color: #1e293b;
      font-weight: 600;
      text-align: right;
    }
    dd.active {
      color: #166534;
    }
    dd.disabled {
      color: #991b1b;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);

  profile = signal<UserProfile | null>(null);
  error = signal<string | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: (user) => {
        this.profile.set(user);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 401) {
          return;
        }
        this.error.set(this.errorDetail(err));
      },
    });
  }

  roleLabel(role: UserProfile['role']): string {
    return ROLE_LABELS[role];
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
    return 'No se pudo cargar el perfil. Inténtalo de nuevo.';
  }
}
