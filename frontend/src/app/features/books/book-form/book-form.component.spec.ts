import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Book, BookService } from '../../../core/books/book.service';
import { BookFormComponent } from './book-form.component';

const book: Book = {
  id: 8,
  isbn: '9780306406157',
  title: 'El Quijote',
  author: 'Cervantes',
  genre: 'Novela',
  publication_year: 1605,
  description: null,
  created_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('BookFormComponent', () => {
  let fixture: ComponentFixture<BookFormComponent>;
  let component: BookFormComponent;
  let books: jasmine.SpyObj<BookService>;
  let router: Router;

  function setup(id: string | null = null): void {
    books = jasmine.createSpyObj<BookService>('BookService', [
      'getBook',
      'createBook',
      'updateBook',
      'deleteBook',
    ]);
    books.getBook.and.returnValue(of(book));
    books.createBook.and.returnValue(of(book));
    books.updateBook.and.returnValue(of(book));
    books.deleteBook.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [BookFormComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: BookService, useValue: books },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id === null ? {} : { id }) } },
        },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(BookFormComponent);
    component = fixture.componentInstance;
  }

  function fillValidForm(): void {
    component.bookForm.setValue({
      isbn: '9780306406157',
      title: 'El Quijote',
      author: 'Cervantes',
      genre: 'Novela',
      publication_year: 1605,
      description: '',
    });
  }

  it('arranca en modo alta', () => {
    setup();
    fixture.detectChanges();

    expect(component.isEditMode()).toBeFalse();
    expect(books.getBook).not.toHaveBeenCalled();
  });

  it('carga el libro en modo edición', () => {
    setup('8');
    fixture.detectChanges();

    expect(component.isEditMode()).toBeTrue();
    expect(component.bookId()).toBe(8);
    expect(component.bookForm.value.title).toBe('El Quijote');
  });

  it('informa si el libro no existe al cargarlo', () => {
    setup('8');
    books.getBook.and.returnValue(throwError(() => ({ status: 404 })));
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Libro no encontrado');
  });

  it('informa otros errores al cargar', () => {
    setup('8');
    books.getBook.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Error al cargar los datos del libro');
  });

  it('valida el ISBN de 10 y 13 dígitos', () => {
    setup();
    expect(component.isbnValidator({ value: '' })).toBeNull();
    expect(component.isbnValidator({ value: '0306406152' })).toBeNull();
    expect(component.isbnValidator({ value: '978-0-306-40615-7' })).toBeNull();
    expect(component.isbnValidator({ value: '123' })).toEqual({ invalidIsbn: true });
  });

  it('muestra el error de ISBN requerido y formato', () => {
    setup();
    fixture.detectChanges();

    component.bookForm.get('isbn')!.markAsTouched();
    expect(component.isbnError).toBe('El ISBN es obligatorio.');

    component.bookForm.patchValue({ isbn: '123' });
    expect(component.isbnError).toBe('El ISBN debe tener 10 o 13 dígitos');
  });

  it('muestra los errores de campos obligatorios y año', () => {
    setup();
    fixture.detectChanges();

    ['title', 'author', 'genre'].forEach((name) => component.bookForm.get(name)!.markAsTouched());

    expect(component.titleError).toBeTrue();
    expect(component.authorError).toBeTrue();
    expect(component.genreError).toBeTrue();

    component.bookForm.get('publication_year')!.markAsTouched();
    expect(component.yearError).toBe('El año de publicación es obligatorio.');

    component.bookForm.patchValue({ publication_year: 1200 });
    expect(component.yearError).toBe('El año de publicación no es válido');
  });

  it('no envía el formulario inválido', () => {
    setup();
    fixture.detectChanges();

    component.onSubmit();

    expect(books.createBook).not.toHaveBeenCalled();
    expect(component.bookForm.controls['isbn'].touched).toBeTrue();
  });

  it('crea un libro y vuelve al catálogo', fakeAsync(() => {
    setup();
    fixture.detectChanges();
    fillValidForm();

    component.onSubmit();
    tick(1300);

    expect(books.createBook).toHaveBeenCalled();
    expect(component.isSubmitting()).toBeFalse();
    expect(component.successMessage()).toBe('Libro registrado exitosamente');
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
  }));

  it('informa el ISBN duplicado al crear', () => {
    setup();
    fixture.detectChanges();
    fillValidForm();
    books.createBook.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'dup' } })),
    );

    component.onSubmit();

    expect(component.errorMessage()).toBe('El ISBN ya está registrado');
  });

  it('usa el detail del backend al crear', () => {
    setup();
    fixture.detectChanges();
    fillValidForm();
    books.createBook.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 422, error: { detail: 'Año inválido' } })),
    );

    component.onSubmit();

    expect(component.errorMessage()).toBe('Año inválido');
  });

  it('usa el mensaje genérico al crear', () => {
    setup();
    fixture.detectChanges();
    fillValidForm();
    books.createBook.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.onSubmit();

    expect(component.errorMessage()).toBe('Error al registrar el libro');
  });

  it('actualiza un libro existente', fakeAsync(() => {
    setup('8');
    fixture.detectChanges();

    component.onSubmit();
    tick(1300);

    expect(books.updateBook).toHaveBeenCalledWith(8, jasmine.anything());
    expect(component.successMessage()).toBe('Libro actualizado exitosamente');
  }));

  it('informa errores al actualizar', () => {
    setup('8');
    fixture.detectChanges();
    books.updateBook.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'dup' } })),
    );

    component.onSubmit();
    expect(component.errorMessage()).toBe('El ISBN ya está registrado');

    books.updateBook.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.onSubmit();
    expect(component.errorMessage()).toBe('Error al actualizar el libro');
  });

  it('no borra fuera del modo edición', () => {
    setup();
    fixture.detectChanges();

    component.onDelete();

    expect(books.deleteBook).not.toHaveBeenCalled();
  });

  it('no borra si el usuario cancela la confirmación', () => {
    setup('8');
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(false);

    component.onDelete();

    expect(books.deleteBook).not.toHaveBeenCalled();
  });

  it('borra el libro y vuelve al catálogo', () => {
    setup('8');
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);

    component.onDelete();

    expect(books.deleteBook).toHaveBeenCalledWith(8);
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
  });

  it('informa el 403 y otros errores al borrar', () => {
    setup('8');
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);

    books.deleteBook.and.returnValue(throwError(() => ({ status: 403 })));
    component.onDelete();
    expect(component.errorMessage()).toBe('No tienes permiso para esta acción');

    books.deleteBook.and.returnValue(throwError(() => ({ status: 500 })));
    component.onDelete();
    expect(component.errorMessage()).toBe('Error al eliminar el libro');
  });
});
