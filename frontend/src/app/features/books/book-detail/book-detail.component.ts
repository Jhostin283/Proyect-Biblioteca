import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { Book, BookService } from '../../../core/books/book.service';
import { BookCoverComponent } from '../../../shared/book-cover/book-cover.component';
import { StateComponent } from '../../../shared/state/state.component';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, BookCoverComponent, StateComponent],
  template: `
    <div class="page page--narrow">
      @if (loading()) {
        <app-state variant="loading" title="Cargando el libro…" />
      } @else if (notFound()) {
        <div class="card">
          <app-state
            variant="empty"
            title="Libro no encontrado"
            message="El libro solicitado no existe o fue eliminado."
            actionLabel="Volver al catálogo"
          />
          <div class="not-found__action">
            <a routerLink="/books" class="btn btn--secondary">&larr; Volver al catálogo</a>
          </div>
        </div>
      } @else {
        @if (book(); as b) {
          <article class="detail card">
            <div class="detail__cover">
              <app-book-cover
                [isbn]="b.isbn"
                [title]="b.title"
                [author]="b.author"
                size="lg"
                [lazy]="false"
              />
            </div>

            <div class="detail__body">
              <div class="detail__heading">
                <span class="badge badge--librarian">{{ b.genre }}</span>
                <h1>{{ b.title }}</h1>
                <p class="detail__author">{{ b.author }} · {{ b.publication_year }}</p>
              </div>

              <dl class="detail__facts">
                <div>
                  <dt>ISBN</dt>
                  <dd class="detail__isbn">{{ b.isbn }}</dd>
                </div>
                <div>
                  <dt>Año de publicación</dt>
                  <dd>{{ b.publication_year }}</dd>
                </div>
                <div>
                  <dt>Género</dt>
                  <dd>{{ b.genre }}</dd>
                </div>
                <div>
                  <dt>Registrado</dt>
                  <dd>{{ b.created_at | date: 'medium' }}</dd>
                </div>
              </dl>

              @if (b.description) {
                <section class="detail__description" aria-label="Descripción">
                  <h2>Descripción</h2>
                  <p>{{ b.description }}</p>
                </section>
              }

              <footer class="detail__actions">
                <a routerLink="/books" class="btn btn--secondary">&larr; Volver al catálogo</a>
                @if (canManageBooks()) {
                  <a [routerLink]="['/books', b.id, 'edit']" class="btn btn--secondary">Editar</a>
                  <button type="button" class="btn btn--danger" (click)="confirmDelete()">
                    Eliminar
                  </button>
                }
              </footer>
            </div>
          </article>
        }
      }

      @if (showDeleteModal()) {
        <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div class="modal card">
            <div class="card__body">
              <h2 id="delete-title">Confirmar eliminación</h2>
              <p>
                ¿Seguro que quieres eliminar <strong>{{ book()?.title }}</strong> de
                {{ book()?.author }}?
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
    .detail {
      display: grid;
      grid-template-columns: 200px minmax(0, 1fr);
      gap: var(--space-6);
      padding: var(--space-6);
      align-items: start;
    }
    .detail__cover { display: flex; justify-content: center; }
    .detail__heading { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; }
    .detail__author { font-size: var(--text-lg); color: var(--color-ink-soft); }
    .detail__facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--space-4);
      margin: var(--space-5) 0;
      padding: var(--space-4) 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .detail__facts dt {
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-ink-faint);
    }
    .detail__facts dd { font-weight: 600; color: var(--color-ink); }
    .detail__isbn { font-variant-numeric: tabular-nums; }
    .detail__description h2 { font-size: var(--text-lg); margin-bottom: var(--space-2); }
    .detail__description p { max-width: 70ch; }
    .detail__actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-5); }
    .not-found__action { text-align: center; padding-bottom: var(--space-5); }
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
    @media (max-width: 720px) {
      .detail { grid-template-columns: 1fr; padding: var(--space-4); gap: var(--space-4); }
      .detail__cover { justify-content: flex-start; }
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
