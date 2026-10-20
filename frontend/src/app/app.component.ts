import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="navbar">
      <div class="nav-container">
        <a routerLink="/" class="brand">Biblioteca</a>
        <nav class="nav-links">
          <a routerLink="/" class="nav-link">Inicio</a>
          <a routerLink="/books" class="nav-link">Libros</a>
          <a routerLink="/users" class="nav-link">Usuarios</a>
          <a routerLink="/login" class="nav-link btn-login">Iniciar sesión</a>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar {
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
      text-decoration: none;
    }
    .nav-links {
      display: flex;
      gap: 1.25rem;
      align-items: center;
    }
    .nav-link {
      color: #475569;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s ease;
    }
    .nav-link:hover {
      color: #2563eb;
      text-decoration: none;
    }
    .btn-login {
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      transition: background-color 0.15s ease;
    }
    .btn-login:hover {
      background-color: #1d4ed8;
    }
    .main-content {
      min-height: calc(100vh - 65px);
    }
  `]
})
export class AppComponent {
  title = 'frontend';
}
