import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { Book, BookService } from '../../../core/books/book.service';
import { BookCoverComponent } from '../../../shared/book-cover/book-cover.component';
import { StateComponent } from '../../../shared/state/state.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BookCoverComponent, StateComponent],
  template: `
    <div class="page">
      <header class="page__header">
        <div class="page__title">
          <span class="page__eyebrow">Catálogo</span>
          <h1>Biblioteca</h1>
          <p class="page__subtitle">
            {{ totalBooks() }} {{ totalBooks() === 1 ? 'libro' : 'libros' }} en el catálogo.
            Busca por título o autor y filtra por género.
          </p>
        </div>
        @if (canManageBooks()) {
          <a routerLink="/books/new" class="btn" id="btn-new-book">+ Nuevo libro</a>
        }
      </header>

      <section class="filters card" aria-label="Filtros del catálogo">
        <div class="filters__grid">
          <div class="field">
            <label for="search-input">Buscar por título o autor</label>
            <input
              id="search-input"
              type="search"
              [(ngModel)]="searchQuery"
              (keyup.enter)="applyFilters()"
              placeholder="Ej.: García Márquez"
            />
          </div>

          <div class="field">
            <label for="genre-select">Género</label>
            <select id="genre-select" [(ngModel)]="selectedGenre" (change)="applyFilters()">
              <option value="">Todos los géneros</option>
              @for (genre of genres(); track genre) {
                <option [value]="genre">{{ genre }}</option>
              }
            </select>
          </div>

          <div class="filters__actions">
            <button type="button" (click)="applyFilters()" class="btn" id="btn-search">Buscar</button>
            <button type="button" (click)="resetFilters()" class="btn btn--secondary" id="btn-reset">
              Limpiar
            </button>
          </div>
        </div>
      </section>

      @if (errorMessage()) {
        <p class="alert alert--error" role="alert">{{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="alert alert--success" role="status">{{ successMessage() }}</p>
      }

      @if (loading()) {
        <app-state variant="loading" title="Cargando el catálogo…" />
      } @else if (books().length === 0) {
        <app-state
          variant="empty"
          title="No hay libros que mostrar"
          message="Prueba con otra búsqueda o cambia el filtro de género."
        />
        @if (canManageBooks()) {
          <p class="empty-action">
            <a routerLink="/books/new" class="btn btn--secondary">Registrar el primer libro</a>
          </p>
        }
      } @else {
        <ul class="catalog-grid">
          @for (book of books(); track book.id) {
            <li class="book-card card">
              <a
                class="book-card__cover"
                [routerLink]="['/books', book.id]"
                [attr.aria-label]="'Ver el detalle de ' + book.title"
              >
                <app-book-cover
                  [isbn]="book.isbn"
                  [title]="book.title"
                  [author]="book.author"
                  size="md"
                />
              </a>

              <div class="book-card__body">
                <span class="badge">{{ book.genre }}</span>
                <h2 class="book-card__title">
                  <a [routerLink]="['/books', book.id]">{{ book.title }}</a>
                </h2>
                <p class="book-card__author">{{ book.author }} · {{ book.publication_year }}</p>
                <p class="book-card__isbn muted">{{ book.isbn }}</p>

                <div class="book-card__actions">
                  <a class="btn btn--sm btn--secondary" [routerLink]="['/books', book.id]">Detalle</a>
                  @if (canManageBooks()) {
                    <a class="btn btn--sm btn--ghost" [routerLink]="['/books', book.id, 'edit']">
                      Editar
                    </a>
                    <button type="button" class="btn btn--sm btn--danger" (click)="confirmDelete(book)">
                      Eliminar
                    </button>
                  }
                </div>
              </div>
            </li>
          }
        </ul>

        <nav class="pagination" aria-label="Paginación del catálogo">
          <span class="muted">
            Página {{ currentPage() }} de {{ totalPages() }} · {{ totalBooks() }} libros
          </span>
          <div class="row">
            <button
              type="button"
              class="btn btn--sm btn--secondary"
              (click)="goToPage(currentPage() - 1)"
              [disabled]="currentPage() <= 1"
            >
              &laquo; Anterior
            </button>
            <button
              type="button"
              class="btn btn--sm btn--secondary"
              (click)="goToPage(currentPage() + 1)"
              [disabled]="currentPage() >= totalPages()"
            >
              Siguiente &raquo;
            </button>
          </div>
        </nav>
      }

      @if (bookToDelete()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div class="modal card">
            <div class="card__body">
              <h2 id="delete-title">Confirmar eliminación</h2>
              <p>
                ¿Seguro que quieres eliminar
                <strong>{{ bookToDelete()?.title }}</strong> de {{ bookToDelete()?.author }}?
              </p>
            </div>
            <div class="card__footer modal__actions">
              <button type="button" class="btn btn--secondary" (click)="cancelDelete()">
                Cancelar
              </button>
              <button type="button" class="btn btn--danger" (click)="executeDelete()">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters { margin-bottom: var(--space-5); }
    .filters__grid {
      display: grid;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
      gap: var(--space-4);
      align-items: end;
      padding: var(--space-5);
    }
    .filters__actions { display: flex; gap: var(--space-2); }
    .alert { margin-bottom: var(--space-4); }
    .empty-action { text-align: center; margin-top: calc(-1 * var(--space-5)); }
    .catalog-grid {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: var(--space-4);
    }
    .book-card { display: flex; gap: var(--space-4); padding: var(--space-4); align-items: flex-start; }
    .book-card__cover { flex: 0 0 auto; display: block; border-radius: var(--radius-sm); }
    .book-card__body { display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
    .book-card__title { font-size: var(--text-lg); line-height: 1.25; }
    .book-card__title a { color: var(--color-ink); }
    .book-card__author { font-size: var(--text-sm); color: var(--color-ink-soft); }
    .book-card__isbn { font-variant-numeric: tabular-nums; }
    .book-card__actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: auto; padding-top: var(--space-2); }
    .pagination {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-5);
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(23, 32, 51, 0.55);
      display: grid;
      place-items: center;
      padding: var(--space-4);
      z-index: 50;
    }
    .modal { width: min(100%, 460px); }
    .modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
    @media (max-width: 860px) {
      .filters__grid { grid-template-columns: 1fr; }
      .filters__actions { justify-content: stretch; }
      .filters__actions .btn { flex: 1; }
    }
    @media (max-width: 520px) {
      .book-card { flex-direction: column; }
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
