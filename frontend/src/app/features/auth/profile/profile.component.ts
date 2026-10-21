import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { StateComponent } from '../../../shared/state/state.component';

const ROLE_LABELS: Record<UserProfile['role'], string> = {
  reader: 'Lector',
  librarian: 'Bibliotecario',
  admin: 'Administrador',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, StateComponent],
  template: `
    <div class="page page--narrow">
      <header class="page__header">
        <div class="page__title">
          <span class="page__eyebrow">Cuenta</span>
          <h1>Mi perfil</h1>
          <p class="page__subtitle">Estos son los datos con los que accedes a la biblioteca.</p>
        </div>
      </header>

      @if (loading()) {
        <app-state variant="loading" title="Cargando tu perfil…" />
      } @else if (error()) {
        <p class="alert alert--error" role="alert">{{ error() }}</p>
      } @else {
        @if (profile(); as user) {
        <article class="card profile">
          <div class="profile__header">
            <span class="profile__avatar" aria-hidden="true">{{ user.full_name.charAt(0) }}</span>
            <div>
              <h2>{{ user.full_name }}</h2>
              <p class="muted">{{ user.email }}</p>
            </div>
            <span class="badge" [class]="'badge--' + user.role">{{ roleLabel(user.role) }}</span>
          </div>

          <dl class="profile__facts">
            <div>
              <dt>Correo electrónico</dt>
              <dd>{{ user.email }}</dd>
            </div>
            <div>
              <dt>Nombre completo</dt>
              <dd>{{ user.full_name }}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{{ roleLabel(user.role) }}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <span class="badge" [class.badge--inactive]="!user.is_active">
                  {{ user.is_active ? 'Activa' : 'Desactivada' }}
                </span>
              </dd>
            </div>
          </dl>
        </article>
        }
      }
    </div>
  `,
  styles: [`
    .profile { padding: var(--space-5); }
    .profile__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }
    .profile__header h2 { font-size: var(--text-xl); }
    .profile__header .badge { margin-left: auto; }
    .profile__avatar {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary-strong);
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 700;
    }
    .profile__facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-4);
      padding-top: var(--space-4);
    }
    .profile__facts dt {
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-faint);
      margin-bottom: var(--space-1);
    }
    .profile__facts dd { font-weight: 600; }
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
