import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book, BookService } from '../../../core/books/book.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="detail-container">
      @if (loading()) {
        <p class="loading-text">Cargando detalles del libro...</p>
      } @else if (notFound()) {
        <div class="not-found-card">
          <h2>Libro no encontrado</h2>
          <p>El libro solicitado no existe o fue eliminado.</p>
          <a routerLink="/books" class="btn btn-primary">Volver al catálogo</a>
        </div>
      } @else {
        @if (book(); as b) {
          <div class="card detail-card">
            <div class="card-header">
              <h2>{{ b.title }}</h2>
              <span class="badge">{{ b.genre }}</span>
            </div>

            <div class="card-body">
              <div class="detail-row">
                <span class="label">Autor:</span>
                <span class="value">{{ b.author }}</span>
              </div>

              <div class="detail-row">
                <span class="label">ISBN:</span>
                <span class="value">{{ b.isbn }}</span>
              </div>

              <div class="detail-row">
                <span class="label">Año de publicación:</span>
                <span class="value">{{ b.publication_year }}</span>
              </div>

              @if (b.description) {
                <div class="detail-row description-row">
                  <span class="label">Descripción:</span>
                  <p class="value description-text">{{ b.description }}</p>
                </div>
              }

              <div class="metadata-row">
                <small>Registrado el: {{ b.created_at | date:'medium' }}</small>
              </div>
            </div>

            <div class="card-footer">
              <a routerLink="/books" class="btn btn-outline">
                &larr; Volver al catálogo
              </a>

              @if (canManageBooks()) {
                <div class="admin-actions">
                  <a [routerLink]="['/books', b.id, 'edit']" class="btn btn-secondary">
                    Editar
                  </a>
                  <button (click)="confirmDelete()" class="btn btn-danger">
                    Eliminar
                  </button>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Modal de Confirmación de Eliminación -->
      @if (showDeleteModal()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <h3>Confirmar eliminación</h3>
            <p>¿Seguro que quieres eliminar este libro?</p>
            <p><strong>"{{ book()?.title }}"</strong> de {{ book()?.author }}</p>
            <div class="modal-actions">
              <button (click)="cancelDelete()" class="btn btn-outline">Cancelar</button>
              <button (click)="executeDelete()" class="btn btn-danger">Sí, eliminar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .loading-text {
      text-align: center;
      color: #64748b;
      margin-top: 3rem;
    }
    .not-found-card {
      text-align: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 3rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .not-found-card h2 {
      color: #dc2626;
      margin-bottom: 0.5rem;
    }
    .not-found-card p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .card-header {
      padding: 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #1e293b;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-weight: 500;
      font-size: 0.85rem;
    }
    .card-body {
      padding: 1.5rem;
    }
    .detail-row {
      display: flex;
      margin-bottom: 1rem;
      align-items: baseline;
    }
    .description-row {
      flex-direction: column;
      align-items: flex-start;
      margin-top: 1.5rem;
    }
    .description-text {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 6px;
      width: 100%;
      margin-top: 0.5rem;
      line-height: 1.5;
    }
    .label {
      width: 160px;
      font-weight: 600;
      color: #475569;
    }
    .value {
      color: #1e293b;
      flex: 1;
    }
    .metadata-row {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #f1f5f9;
      color: #94a3b8;
    }
    .card-footer {
      padding: 1.25rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .admin-actions {
      display: flex;
      gap: 0.75rem;
    }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      border: 1px solid transparent;
      font-size: 0.9rem;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-secondary {
      background: #64748b;
      color: #ffffff;
    }
    .btn-danger {
      background: #dc2626;
      color: #ffffff;
    }
    .btn-outline {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #475569;
    }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 8px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
})
export class BookDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private authService = inject(AuthService);

  book = signal<Book | null>(null);
  loading = signal<boolean>(true);
  notFound = signal<boolean>(false);
  showDeleteModal = signal<boolean>(false);

  canManageBooks(): boolean {
    return this.authService.hasRole('librarian') || this.authService.hasRole('admin');
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const bookId = Number(idParam);
    if (!bookId) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.bookService.getBook(bookId).subscribe({
      next: (b) => {
        this.book.set(b);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      }
    });
  }

  confirmDelete(): void {
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  executeDelete(): void {
    const b = this.book();
    if (!b) return;

    this.bookService.deleteBook(b.id).subscribe({
      next: () => {
        this.showDeleteModal.set(false);
        this.router.navigate(['/books']);
      },
      error: () => {
        this.showDeleteModal.set(false);
      }
    });
  }
}
