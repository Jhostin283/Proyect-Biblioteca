import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';

interface HealthResponse {
  status: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero__content">
          <span class="page__eyebrow">Sistema de Gestión de Libros</span>
          <h1 id="hero-title">Tu biblioteca, ordenada y siempre a mano</h1>
          <p class="hero__lead">
            Explora el catálogo, registra nuevos títulos y administra a los usuarios de la biblioteca
            desde un solo lugar.
          </p>
          <div class="hero__actions">
            @if (isAuthenticated()) {
              <a routerLink="/books" class="btn">Ver el catálogo</a>
              @if (canManageBooks()) {
                <a routerLink="/books/new" class="btn btn--secondary">Registrar un libro</a>
              }
            } @else {
              <a routerLink="/login" class="btn">Iniciar sesión</a>
              <a routerLink="/register" class="btn btn--secondary">Crear una cuenta</a>
            }
          </div>
        </div>

        <figure class="hero__art">
          <img
            src="library-hero.svg"
            alt="Ilustración de una estantería de biblioteca con libros y una escalera"
            width="520"
            height="400"
          />
        </figure>
      </section>

      <section class="status card" aria-labelledby="status-title">
        <div class="status__body">
          <div>
            <h2 id="status-title">Estado del sistema</h2>
            <p class="muted">Comprobación en vivo de la API de la biblioteca.</p>
          </div>
          <p class="status__pill" [class]="'status__pill ' + statusClass()" role="status">
            <span class="status__dot" aria-hidden="true"></span>
            {{ healthMessage() }}
          </p>
        </div>
      </section>

      <section class="highlights" aria-label="Qué puedes hacer">
        <article class="card highlight">
          <h2>Catálogo completo</h2>
          <p>Consulta cada libro con su portada, autor, género y año de publicación.</p>
        </article>
        <article class="card highlight">
          <h2>Búsqueda instantánea</h2>
          <p>Encuentra por título o autor y filtra por género en segundos.</p>
        </article>
        <article class="card highlight">
          <h2>Roles claros</h2>
          <p>Los lectores consultan; bibliotecarios y administradores gestionan el fondo.</p>
        </article>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
      align-items: center;
      gap: var(--space-6);
      padding: var(--space-6) 0 var(--space-7);
    }
    .hero__content { display: flex; flex-direction: column; gap: var(--space-3); }
    .hero__content h1 { font-size: clamp(2rem, 4vw, 2.9rem); letter-spacing: -0.01em; }
    .hero__lead { font-size: var(--text-lg); max-width: 46ch; }
    .hero__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-3); }
    .hero__art { display: flex; justify-content: center; }
    .hero__art img { width: 100%; max-width: 520px; height: auto; }
    .status { margin-bottom: var(--space-5); }
    .status__body {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-5);
    }
    .status__body h2 { font-size: var(--text-xl); margin-bottom: var(--space-1); }
    .status__pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-pill);
      font-weight: 600;
      font-size: var(--text-sm);
      border: 1px solid var(--color-border);
      background: var(--color-surface-alt);
    }
    .status__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--color-ink-faint); }
    .status-ok { background: var(--color-success-soft); border-color: #b7e4c7; color: var(--color-success); }
    .status-ok .status__dot { background: var(--color-success); }
    .status-error { background: var(--color-danger-soft); border-color: #f4c7c3; color: var(--color-danger); }
    .status-error .status__dot { background: var(--color-danger); }
    .status-loading { color: var(--color-ink-faint); }
    .highlights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
    }
    .highlight { padding: var(--space-5); }
    .highlight h2 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
    .highlight p { font-size: var(--text-sm); }
    @media (max-width: 860px) {
      .hero { grid-template-columns: 1fr; padding-top: var(--space-3); }
      .hero__art { order: -1; }
      .hero__art img { max-width: 340px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  healthMessage = signal<string>('Comprobando API...');
  statusClass = signal<string>('status-loading');

  isAuthenticated(): boolean {
    return this.auth.isAuthenticated();
  }

  canManageBooks(): boolean {
    return this.auth.hasRole('librarian') || this.auth.hasRole('admin');
  }

  ngOnInit(): void {
    this.checkHealth();
  }

  checkHealth(): void {
    this.http.get<HealthResponse>('/api/health').subscribe({
      next: (res) => {
        if (res && res.status === 'ok') {
          this.healthMessage.set('API: ok');
          this.statusClass.set('status-ok');
        } else {
          this.healthMessage.set('API: sin conexión');
          this.statusClass.set('status-error');
        }
      },
      error: () => {
        this.healthMessage.set('API: sin conexión');
        this.statusClass.set('status-error');
      }
    });
  }
}
