import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Book, BookService } from '../../../core/books/book.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="catalog-container">
      <div class="header-section">
        <h2>Catálogo de Libros</h2>
        @if (canManageBooks()) {
          <a routerLink="/books/new" class="btn btn-primary" id="btn-new-book">
            + Nuevo libro
          </a>
        }
      </div>

      <!-- Barra de Filtros -->
      <div class="filters-card">
        <div class="filter-group">
          <label for="search-input">Buscar por título o autor:</label>
          <input
            id="search-input"
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="applyFilters()"
            placeholder="Ej: García Márquez..."
            class="form-control"
          />
        </div>

        <div class="filter-group">
          <label for="genre-select">Filtrar por género:</label>
          <select
            id="genre-select"
            [(ngModel)]="selectedGenre"
            (change)="applyFilters()"
            class="form-control"
          >
            <option value="">Todos los géneros</option>
            @for (genre of genres(); track genre) {
              <option [value]="genre">{{ genre }}</option>
            }
          </select>
        </div>

        <div class="filter-actions">
          <button (click)="applyFilters()" class="btn btn-secondary" id="btn-search">
            Buscar
          </button>
          <button (click)="resetFilters()" class="btn btn-outline" id="btn-reset">
            Limpiar
          </button>
        </div>
      </div>

      <!-- Mensajes -->
      @if (errorMessage()) {
        <div class="alert alert-error">{{ errorMessage() }}</div>
      }

      @if (successMessage()) {
        <div class="alert alert-success">{{ successMessage() }}</div>
      }

      <!-- Listado de Libros -->
      @if (loading()) {
        <p class="loading-text">Cargando catálogo de libros...</p>
      } @else if (books().length === 0) {
        <div class="empty-state">
          <p>No se encontraron libros</p>
        </div>
      } @else {
        <div class="table-responsive">
          <table class="books-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Género</th>
                <th>Año</th>
                <th>ISBN</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (book of books(); track book.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/books', book.id]" class="book-title-link">
                      <strong>{{ book.title }}</strong>
                    </a>
                  </td>
                  <td>{{ book.author }}</td>
                  <td>
                    <span class="badge">{{ book.genre }}</span>
                  </td>
                  <td>{{ book.publication_year }}</td>
                  <td>{{ book.isbn }}</td>
                  <td class="actions-cell">
                    <a [routerLink]="['/books', book.id]" class="btn btn-sm btn-info">
                      Ver detalle
                    </a>
                    @if (canManageBooks()) {
                      <a [routerLink]="['/books', book.id, 'edit']" class="btn btn-sm btn-secondary">
                        Editar
                      </a>
                      <button (click)="confirmDelete(book)" class="btn btn-sm btn-danger">
                        Eliminar
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="pagination-bar">
          <span class="pagination-info">
            Página {{ currentPage() }} de {{ totalPages() }} ({{ totalBooks() }} libros en total)
          </span>

          <div class="pagination-controls">
            <button
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() <= 1"
              class="btn btn-sm btn-outline"
            >
              &laquo; Anterior
            </button>
            <button
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() >= totalPages()"
              class="btn btn-sm btn-outline"
            >
              Siguiente &raquo;
            </button>
          </div>
        </div>
      }

      <!-- Modal de Confirmación de Eliminación -->
      @if (bookToDelete()) {
        <div class="modal-backdrop">
          <div class="modal-dialog">
            <h3>Confirmar eliminación</h3>
            <p>¿Seguro que quieres eliminar este libro?</p>
            <p><strong>"{{ bookToDelete()?.title }}"</strong> de {{ bookToDelete()?.author }}</p>
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
    .catalog-container {
      max-width: 1000px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .filters-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
      margin-bottom: 1.5rem;
    }
    .filter-group {
      flex: 1;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .filter-group label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #334155;
    }
    .form-control {
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.95rem;
    }
    .filter-actions {
      display: flex;
      gap: 0.5rem;
    }
    .table-responsive {
      overflow-x: auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .books-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .books-table th {
      background: #f1f5f9;
      padding: 0.75rem 1rem;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
    }
    .books-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    .book-title-link {
      color: #2563eb;
      text-decoration: none;
    }
    .book-title-link:hover {
      text-decoration: underline;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      background: #e0f2fe;
      color: #0369a1;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .actions-cell {
      display: flex;
      gap: 0.4rem;
      align-items: center;
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
    .btn-sm {
      padding: 0.3rem 0.6rem;
      font-size: 0.825rem;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-secondary {
      background: #64748b;
      color: #ffffff;
    }
    .btn-info {
      background: #0284c7;
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
    .btn-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding: 0.5rem 0;
    }
    .pagination-info {
      font-size: 0.9rem;
      color: #64748b;
    }
    .pagination-controls {
      display: flex;
      gap: 0.5rem;
    }
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      color: #64748b;
      font-size: 1.1rem;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .alert-error {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .alert-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
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
export class BookListComponent implements OnInit {
  private bookService = inject(BookService);
  private authService = inject(AuthService);

  books = signal<Book[]>([]);
  genres = signal<string[]>([]);
  totalBooks = signal<number>(0);
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  searchQuery = '';
  selectedGenre = '';

  bookToDelete = signal<Book | null>(null);

  get totalPages(): () => number {
    return () => Math.max(1, Math.ceil(this.totalBooks() / this.pageSize()));
  }

  canManageBooks(): boolean {
    return this.authService.hasRole('librarian') || this.authService.hasRole('admin');
  }

  ngOnInit(): void {
    this.loadGenres();
    this.loadBooks();
  }

  loadGenres(): void {
    this.bookService.getGenres().subscribe({
      next: (genres) => this.genres.set(genres),
      error: () => {} // Silencioso si falla
    });
  }

  loadBooks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.bookService.getBooks({
      q: this.searchQuery.trim() || undefined,
      genre: this.selectedGenre || undefined,
      page: this.currentPage(),
      size: this.pageSize()
    }).subscribe({
      next: (resp) => {
        this.books.set(resp.items);
        this.totalBooks.set(resp.total);
        this.currentPage.set(resp.page);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al cargar los libros');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadBooks();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedGenre = '';
    this.currentPage.set(1);
    this.loadBooks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBooks();
    }
  }

  confirmDelete(book: Book): void {
    this.bookToDelete.set(book);
  }

  cancelDelete(): void {
    this.bookToDelete.set(null);
  }

  executeDelete(): void {
    const book = this.bookToDelete();
    if (!book) return;

    this.bookService.deleteBook(book.id).subscribe({
      next: () => {
        this.successMessage.set('Libro eliminado exitosamente');
        this.bookToDelete.set(null);
        this.loadBooks();
        this.loadGenres();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al eliminar el libro');
        this.bookToDelete.set(null);
      }
    });
  }
}
