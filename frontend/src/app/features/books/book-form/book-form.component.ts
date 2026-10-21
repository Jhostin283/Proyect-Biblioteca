import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BookService } from '../../../core/books/book.service';
import { BookCoverComponent } from '../../../shared/book-cover/book-cover.component';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BookCoverComponent],
  template: `
    <div class="page page--narrow">
      <header class="page__header">
        <div class="page__title">
          <span class="page__eyebrow">{{ isEditMode() ? 'Editar' : 'Nuevo' }}</span>
          <h1>{{ isEditMode() ? 'Editar libro' : 'Registrar un libro' }}</h1>
          <p class="page__subtitle">
            Los campos con * son obligatorios. La portada se toma de Open Library a partir del ISBN.
          </p>
        </div>
        <a routerLink="/books" class="btn btn--secondary">&larr; Volver al catálogo</a>
      </header>

      @if (errorMessage()) {
        <p class="alert alert--error" role="alert">{{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="alert alert--success" role="status">{{ successMessage() }}</p>
      }

      <form [formGroup]="bookForm" (ngSubmit)="onSubmit()" class="form-layout" novalidate>
        <aside class="preview card" aria-label="Vista previa de la portada">
          <div class="preview__cover">
            @if (isbnForPreview) {
              <app-book-cover
                [isbn]="isbnForPreview"
                [title]="previewTitle"
                [author]="bookForm.value.author || ''"
                size="lg"
                [lazy]="false"
              />
            } @else {
              <div class="preview__empty" aria-hidden="true">?</div>
            }
          </div>
          <p class="preview__hint">
            @if (isbnForPreview) {
              Vista previa de la portada para el ISBN {{ isbnForPreview }}.
            } @else {
              Escribe un ISBN de 10 o 13 dígitos para ver la portada.
            }
          </p>
        </aside>

        <div class="form-card card">
          <div class="form-grid card__body">
            <div class="field">
              <label for="isbn">ISBN *</label>
              <input
                id="isbn"
                type="text"
                formControlName="isbn"
                inputmode="numeric"
                placeholder="Ej.: 9786073112878 (10 o 13 dígitos)"
              />
              @if (isbnError) {
                <span class="field__error">{{ isbnError }}</span>
              }
            </div>

            <div class="field">
              <label for="title">Título *</label>
              <input id="title" type="text" formControlName="title" placeholder="Título del libro" />
              @if (titleError) {
                <span class="field__error">El título es obligatorio.</span>
              }
            </div>

            <div class="field">
              <label for="author">Autor *</label>
              <input id="author" type="text" formControlName="author" placeholder="Autor del libro" />
              @if (authorError) {
                <span class="field__error">El autor es obligatorio.</span>
              }
            </div>

            <div class="field">
              <label for="genre">Género *</label>
              <input id="genre" type="text" formControlName="genre" placeholder="Ej.: Novela, Ficción" />
              @if (genreError) {
                <span class="field__error">El género es obligatorio.</span>
              }
            </div>

            <div class="field">
              <label for="publication_year">Año de publicación *</label>
              <input
                id="publication_year"
                type="number"
                formControlName="publication_year"
                placeholder="Ej.: 1967"
              />
              @if (yearError) {
                <span class="field__error">{{ yearError }}</span>
              }
            </div>

            <div class="field field--wide">
              <label for="description">Descripción</label>
              <textarea
                id="description"
                rows="4"
                formControlName="description"
                placeholder="Sinopsis o descripción opcional"
              ></textarea>
            </div>
          </div>

          <div class="card__footer form-actions">
            <button type="submit" [disabled]="bookForm.invalid || isSubmitting()" class="btn">
              {{
                isSubmitting()
                  ? 'Guardando…'
                  : (isEditMode() ? 'Actualizar libro' : 'Registrar libro')
              }}
            </button>
            @if (isEditMode()) {
              <button type="button" (click)="onDelete()" class="btn btn--danger">
                Eliminar libro
              </button>
            }
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-layout {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr);
      gap: var(--space-5);
      align-items: start;
    }
    .preview {
      position: sticky;
      top: var(--space-5);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-4);
    }
    .preview__cover { display: flex; justify-content: center; }
    .preview__empty {
      width: 160px;
      aspect-ratio: 2 / 3;
      display: grid;
      place-items: center;
      border-radius: 8px;
      border: 1px dashed var(--color-border-strong);
      background: var(--color-surface-alt);
      color: var(--color-ink-faint);
      font-family: var(--font-display);
      font-size: 2rem;
    }
    .preview__hint { font-size: var(--text-xs); text-align: center; color: var(--color-ink-faint); }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-4);
    }
    .field--wide { grid-column: 1 / -1; }
    .form-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); justify-content: flex-end; }
    .alert { margin-bottom: var(--space-4); }
    @media (max-width: 860px) {
      .form-layout { grid-template-columns: 1fr; }
      .preview { position: static; }
    }
    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-actions .btn { width: 100%; }
    }
  `]
})
export class BookFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEditMode = signal<boolean>(false);
  bookId = signal<number | null>(null);
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  currentYear = new Date().getFullYear();

  bookForm: FormGroup = this.fb.group({
    isbn: ['', [Validators.required, this.isbnValidator]],
    title: ['', [Validators.required]],
    author: ['', [Validators.required]],
    genre: ['', [Validators.required]],
    publication_year: [
      null,
      [Validators.required, Validators.min(1450), Validators.max(this.currentYear)]
    ],
    description: ['']
  });

  get isbnError(): string | null {
    const control = this.bookForm.get('isbn');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'El ISBN es obligatorio.';
      if (control.errors['invalidIsbn']) return 'El ISBN debe tener 10 o 13 dígitos';
    }
    return null;
  }

  get titleError(): boolean {
    const control = this.bookForm.get('title');
    return !!(control?.touched && control?.errors?.['required']);
  }

  get authorError(): boolean {
    const control = this.bookForm.get('author');
    return !!(control?.touched && control?.errors?.['required']);
  }

  get genreError(): boolean {
    const control = this.bookForm.get('genre');
    return !!(control?.touched && control?.errors?.['required']);
  }

  get yearError(): string | null {
    const control = this.bookForm.get('publication_year');
    if (control?.touched && control?.errors) {
      if (control.errors['required']) return 'El año de publicación es obligatorio.';
      if (control.errors['min'] || control.errors['max']) {
        return 'El año de publicación no es válido';
      }
    }
    return null;
  }

  /** ISBN normalizado solo si tiene 10 o 13 dígitos; si no, no se pide portada. */
  get isbnForPreview(): string {
    const value = String(this.bookForm.get('isbn')?.value ?? '').replace(/[^0-9Xx]/g, '');
    return value.length === 10 || value.length === 13 ? value : '';
  }

  get previewTitle(): string {
    return String(this.bookForm.get('title')?.value || 'Vista previa');
  }

  isbnValidator(control: { value: string | null }) {
    if (!control.value) return null;
    const clean = control.value.replace(/-/g, '').trim();
    if (/^\d{10}$/.test(clean) || /^\d{13}$/.test(clean)) {
      return null;
    }
    return { invalidIsbn: true };
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      const id = parseInt(idParam, 10);
      this.bookId.set(id);
      this.loadBook(id);
    }
  }

  loadBook(id: number): void {
    this.bookService.getBook(id).subscribe({
      next: (book) => {
        this.bookForm.patchValue({
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          genre: book.genre,
          publication_year: book.publication_year,
          description: book.description || ''
        });
      },
      error: (err) => {
        if (err.status === 404) {
          this.errorMessage.set('Libro no encontrado');
        } else {
          this.errorMessage.set('Error al cargar los datos del libro');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.bookForm.invalid) {
      this.bookForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formVal = this.bookForm.value;

    if (this.isEditMode()) {
      this.bookService.updateBook(this.bookId()!, formVal).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Libro actualizado exitosamente');
          setTimeout(() => this.router.navigate(['/books']), 1200);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.status === 409) {
            this.errorMessage.set('El ISBN ya está registrado');
          } else if (err.error?.detail) {
            this.errorMessage.set(err.error.detail);
          } else {
            this.errorMessage.set('Error al actualizar el libro');
          }
        }
      });
    } else {
      this.bookService.createBook(formVal).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Libro registrado exitosamente');
          setTimeout(() => this.router.navigate(['/books']), 1200);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.status === 409) {
            this.errorMessage.set('El ISBN ya está registrado');
          } else if (err.error?.detail) {
            this.errorMessage.set(err.error.detail);
          } else {
            this.errorMessage.set('Error al registrar el libro');
          }
        }
      });
    }
  }

  onDelete(): void {
    if (!this.bookId()) return;

    const confirmed = window.confirm('¿Seguro que quieres eliminar este libro?');
    if (!confirmed) return;

    this.isSubmitting.set(true);
    this.bookService.deleteBook(this.bookId()!).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/books']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 403) {
          this.errorMessage.set('No tienes permiso para esta acción');
        } else {
          this.errorMessage.set('Error al eliminar el libro');
        }
      }
    });
  }
}
