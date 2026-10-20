import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../core/books/book.service';

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-container">
      <div class="header">
        <h2>{{ isEditMode() ? 'Editar Libro' : 'Nuevo Libro' }}</h2>
        <a routerLink="/books" class="btn-secondary">Volver al catálogo</a>
      </div>

      <div *ngIf="errorMessage()" class="alert alert-danger">
        {{ errorMessage() }}
      </div>

      <div *ngIf="successMessage()" class="alert alert-success">
        {{ successMessage() }}
      </div>

      <form [formGroup]="bookForm" (ngSubmit)="onSubmit()" class="form-card">
        <div class="form-group">
          <label for="isbn">ISBN *</label>
          <input
            id="isbn"
            type="text"
            formControlName="isbn"
            placeholder="Ej: 9786073112878 (10 o 13 dígitos)"
          />
          <div *ngIf="isbnError" class="field-error">
            {{ isbnError }}
          </div>
        </div>

        <div class="form-group">
          <label for="title">Título *</label>
          <input id="title" type="text" formControlName="title" placeholder="Título del libro" />
          <div *ngIf="titleError" class="field-error">
            El título es obligatorio.
          </div>
        </div>

        <div class="form-group">
          <label for="author">Autor *</label>
          <input id="author" type="text" formControlName="author" placeholder="Autor del libro" />
          <div *ngIf="authorError" class="field-error">
            El autor es obligatorio.
          </div>
        </div>

        <div class="form-group">
          <label for="genre">Género *</label>
          <input id="genre" type="text" formControlName="genre" placeholder="Ej: Novela, Ficción" />
          <div *ngIf="genreError" class="field-error">
            El género es obligatorio.
          </div>
        </div>

        <div class="form-group">
          <label for="publication_year">Año de publicación *</label>
          <input
            id="publication_year"
            type="number"
            formControlName="publication_year"
            placeholder="Ej: 1967"
          />
          <div *ngIf="yearError" class="field-error">
            {{ yearError }}
          </div>
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            rows="4"
            formControlName="description"
            placeholder="Sinopsis o descripción opcional"
          ></textarea>
        </div>

        <div class="actions">
          <button type="submit" [disabled]="bookForm.invalid || isSubmitting()" class="btn-primary">
            {{ isSubmitting() ? 'Guardando...' : (isEditMode() ? 'Actualizar libro' : 'Registrar libro') }}
          </button>

          <button
            *ngIf="isEditMode()"
            type="button"
            (click)="onDelete()"
            class="btn-danger"
          >
            Eliminar libro
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 650px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .form-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      margin-bottom: 0.35rem;
      font-weight: 500;
      color: #334155;
    }
    input, textarea {
      width: 100%;
      padding: 0.6rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 1rem;
      font-family: inherit;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
    }
    .field-error {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    .alert-danger {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .alert-success {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }
    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
    }
    button {
      padding: 0.6rem 1.25rem;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      border: none;
      transition: background-color 0.15s ease;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-primary {
      background-color: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover:not(:disabled) {
      background-color: #1d4ed8;
    }
    .btn-danger {
      background-color: #dc2626;
      color: #ffffff;
    }
    .btn-danger:hover {
      background-color: #b91c1c;
    }
    .btn-secondary {
      color: #475569;
      padding: 0.4rem 0.8rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      text-decoration: none;
    }
    .btn-secondary:hover {
      background-color: #f1f5f9;
      text-decoration: none;
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
