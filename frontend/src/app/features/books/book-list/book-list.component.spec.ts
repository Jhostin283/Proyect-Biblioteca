import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { Book, BookService, PaginatedBooks } from '../../../core/books/book.service';
import { BookListComponent } from './book-list.component';

const book: Book = {
  id: 1,
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

const page: PaginatedBooks = { items: [book], total: 25, page: 1, size: 10 };

const admin: UserProfile = {
  id: 1,
  email: 'admin@correo.com',
  full_name: 'Admin',
  role: 'admin',
  is_active: true,
};

describe('BookListComponent', () => {
  let fixture: ComponentFixture<BookListComponent>;
  let component: BookListComponent;
  let books: jasmine.SpyObj<BookService>;
  let auth: jasmine.SpyObj<AuthService>;

  function setup(role: 'reader' | 'librarian' | 'admin' = 'admin'): void {
    books = jasmine.createSpyObj<BookService>('BookService', [
      'getBooks',
      'getGenres',
      'deleteBook',
    ]);
    books.getBooks.and.callFake((params) =>
      of({ ...page, page: params?.page ?? 1, size: params?.size ?? 10 }),
    );
    books.getGenres.and.returnValue(of(['Novela', 'Poesía']));

    auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    (auth as unknown as { currentUser: () => UserProfile }).currentUser = () => ({ ...admin, role });
    auth.hasRole.and.callFake((r) => r === role);

    TestBed.configureTestingModule({
      imports: [BookListComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: BookService, useValue: books },
        { provide: AuthService, useValue: auth },
      ],
    });

    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
  }

  it('carga géneros y libros al iniciar', () => {
    setup();
    fixture.detectChanges();

    expect(books.getGenres).toHaveBeenCalled();
    expect(books.getBooks).toHaveBeenCalledWith({
      q: undefined,
      genre: undefined,
      page: 1,
      size: 10,
    });
    expect(component.books()).toEqual([book]);
    expect(component.totalBooks()).toBe(25);
    expect(component.genres()).toEqual(['Novela', 'Poesía']);
    expect(component.totalPages()).toBe(3);
  });

  it('muestra el detalle del error al cargar libros', () => {
    setup();
    books.getBooks.and.returnValue(throwError(() => ({ error: { detail: 'Fallo del servidor' } })));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Fallo del servidor');
    expect(component.loading()).toBeFalse();
  });

  it('usa un mensaje genérico si el error no trae detalle', () => {
    setup();
    books.getBooks.and.returnValue(throwError(() => ({})));

    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Error al cargar los libros');
  });

  it('aplica filtros y vuelve a la primera página', () => {
    setup();
    fixture.detectChanges();
    component.currentPage.set(3);
    component.searchQuery = '  quijote ';
    component.selectedGenre = 'Novela';

    component.applyFilters();

    expect(component.currentPage()).toBe(1);
    expect(books.getBooks).toHaveBeenCalledWith({
      q: 'quijote',
      genre: 'Novela',
      page: 1,
      size: 10,
    });
  });

  it('limpia los filtros', () => {
    setup();
    fixture.detectChanges();
    component.searchQuery = 'algo';
    component.selectedGenre = 'Novela';

    component.resetFilters();

    expect(component.searchQuery).toBe('');
    expect(component.selectedGenre).toBe('');
    expect(component.currentPage()).toBe(1);
  });

  it('cambia de página solo dentro del rango', () => {
    setup();
    fixture.detectChanges();

    component.goToPage(2);
    expect(component.currentPage()).toBe(2);

    component.goToPage(0);
    expect(component.currentPage()).toBe(2);

    component.goToPage(99);
    expect(component.currentPage()).toBe(2);
  });

  it('sabe quién puede gestionar libros', () => {
    setup('reader');
    expect(component.canManageBooks()).toBeFalse();

    TestBed.resetTestingModule();
    setup('librarian');
    expect(component.canManageBooks()).toBeTrue();
  });

  it('elimina un libro confirmado y refresca la lista', fakeAsync(() => {
    setup();
    fixture.detectChanges();
    books.deleteBook.and.returnValue(of(void 0));

    component.confirmDelete(book);
    expect(component.bookToDelete()).toEqual(book);

    component.executeDelete();
    tick(3100);

    expect(books.deleteBook).toHaveBeenCalledWith(1);
    expect(component.bookToDelete()).toBeNull();
    expect(component.successMessage()).toBe('');
  }));

  it('no elimina si no hay libro seleccionado', () => {
    setup();
    fixture.detectChanges();
    component.cancelDelete();

    component.executeDelete();

    expect(books.deleteBook).not.toHaveBeenCalled();
  });

  it('muestra el error al eliminar', () => {
    setup();
    fixture.detectChanges();
    books.deleteBook.and.returnValue(throwError(() => ({ error: { detail: 'No permitido' } })));

    component.confirmDelete(book);
    component.executeDelete();

    expect(component.errorMessage()).toBe('No permitido');
    expect(component.bookToDelete()).toBeNull();
  });

  it('usa un mensaje genérico si falla el borrado', () => {
    setup();
    fixture.detectChanges();
    books.deleteBook.and.returnValue(throwError(() => ({})));

    component.confirmDelete(book);
    component.executeDelete();

    expect(component.errorMessage()).toBe('Error al eliminar el libro');
  });
});
