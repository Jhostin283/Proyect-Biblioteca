import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface HealthResponse {
  status: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <header class="hero">
        <h1>Sistema de Gestión de Libros</h1>
        <p>Bienvenido al catálogo digital y gestión de biblioteca.</p>
      </header>

      <section class="status-card">
        <h2>Estado del Sistema</h2>
        <div class="status-indicator" [ngClass]="statusClass()">
          <span class="status-dot"></span>
          <span class="status-text">{{ healthMessage() }}</span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .hero {
      text-align: center;
      margin-bottom: 2rem;
    }
    .hero h1 {
      font-size: 2.25rem;
      margin-bottom: 0.5rem;
      color: #1e293b;
    }
    .hero p {
      color: #64748b;
      font-size: 1.125rem;
    }
    .status-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .status-card h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #334155;
    }
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 6px;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .status-ok {
      background-color: #f0fdf4;
      color: #166534;
    }
    .status-ok .status-dot {
      background-color: #22c55e;
    }
    .status-error {
      background-color: #fef2f2;
      color: #991b1b;
    }
    .status-error .status-dot {
      background-color: #ef4444;
    }
    .status-loading {
      background-color: #f8fafc;
      color: #64748b;
    }
    .status-loading .status-dot {
      background-color: #94a3b8;
    }
  `]
})
export class HomeComponent implements OnInit {
  private http = inject(HttpClient);
  healthMessage = signal<string>('Comprobando API...');
  statusClass = signal<string>('status-loading');

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
