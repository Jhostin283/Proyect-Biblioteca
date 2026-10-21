import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SessionNoticeService } from './core/auth/auth-notice.service';
import { AuthService } from './core/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar__inner">
        <a routerLink="/" class="brand" aria-label="Ir al inicio de Biblioteca">
          <span class="brand__mark" aria-hidden="true">B</span>
          <span class="brand__name">Biblioteca</span>
        </a>

        <nav class="nav" aria-label="Navegación principal">
          <a
            routerLink="/"
            routerLinkActive="is-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav__link"
          >Inicio</a>
          <a routerLink="/books" routerLinkActive="is-active" class="nav__link">Libros</a>

          @if (isAdmin()) {
            <a routerLink="/users" routerLinkActive="is-active" class="nav__link">Usuarios</a>
          }

          @if (isAuthenticated()) {
            <a routerLink="/profile" routerLinkActive="is-active" class="nav__link">Mi perfil</a>
            <button type="button" class="btn btn--secondary btn--sm" (click)="logout()">
              Cerrar sesión
            </button>
          } @else {
            <a routerLink="/login" class="btn btn--sm btn-login">Iniciar sesión</a>
          }
        </nav>
      </div>
    </header>

    @if (notice.message(); as message) {
      <div class="session-notice" role="alert" aria-live="assertive">{{ message }}</div>
    }

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>

    <footer class="footer">
      <div class="footer__inner">
        <span>Biblioteca · Sistema de Gestión de Libros</span>
        <span class="muted">Grupo 2 · FastAPI + Angular</span>
      </div>
    </footer>
  `,
  styles: [`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(246, 244, 239, 0.92);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--color-border);
    }
    .navbar__inner {
      width: min(100% - 2rem, var(--container));
      margin: 0 auto;
      padding: var(--space-3) 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
    }
    .brand { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--color-ink); }
    .brand:hover { text-decoration: none; }
    .brand__mark {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 9px;
      background: var(--color-primary);
      color: #ffffff;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 700;
    }
    .brand__name { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; }
    .nav { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
    .nav__link {
      padding: 0.35rem 0.7rem;
      border-radius: var(--radius-pill);
      color: var(--color-ink-soft);
      font-weight: 500;
      font-size: var(--text-sm);
    }
    .nav__link:hover { background: var(--color-primary-soft); color: var(--color-primary-strong); text-decoration: none; }
    .nav__link.is-active { background: var(--color-primary-soft); color: var(--color-primary-strong); font-weight: 700; }
    .btn-login { margin-left: var(--space-2); }
    .session-notice {
      background: var(--color-warning-soft);
      border-bottom: 1px solid #f2d9a8;
      color: var(--color-warning-ink);
      padding: var(--space-2) var(--space-4);
      text-align: center;
      font-weight: 600;
      font-size: var(--text-sm);
    }
    .main-content { min-height: calc(100vh - 190px); }
    .footer { border-top: 1px solid var(--color-border); margin-top: var(--space-7); }
    .footer__inner {
      width: min(100% - 2rem, var(--container));
      margin: 0 auto;
      padding: var(--space-4) 0;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--color-ink-faint);
    }
    @media (max-width: 720px) {
      .navbar__inner { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
      .nav { width: 100%; overflow-x: auto; padding-bottom: 2px; }
      .nav__link, .btn-login { white-space: nowrap; }
    }
  `]
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly notice = inject(SessionNoticeService);
  readonly isAuthenticated = computed(
    () => this.auth.currentUser() !== null && this.auth.getToken() !== null,
  );
  readonly isAdmin = computed(() => this.auth.hasRole('admin'));

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
