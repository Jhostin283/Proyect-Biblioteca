import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { Book, BookService } from '../../../core/books/book.service';
import { BookDetailComponent } from './book-detail.component';

const book: Book = {
  id: 5,
  isbn: '9780306406157',
  title: 'El Quijote',
  author: 'Cervantes',
  genre: 'Novela',
  publication_year: 1605,
  description: 'Clásico',
  created_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const librarian: UserProfile = {
  id: 2,
  email: 'lib@correo.com',
  full_name: 'Lib',
  role: 'librarian',
  is_active: true,
};

describe('BookDetailComponent', () => {
  let fixture: ComponentFixture<BookDetailComponent>;
  let component: BookDetailComponent;
  let books: jasmine.SpyObj<BookService>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  function setup(id: string | null, role: 'reader' | 'librarian' = 'librarian'): void {
    books = jasmine.createSpyObj<BookService>('BookService', ['getBook', 'deleteBook']);
    books.getBook.and.returnValue(of(book));
    books.deleteBook.and.returnValue(of(void 0));

    auth = jasmine.createSpyObj<AuthService>('AuthService', ['hasRole']);
    (auth as unknown as { currentUser: () => UserProfile }).currentUser = () => librarian;
    auth.hasRole.and.callFake((r) => r === role);

    TestBed.configureTestingModule({
      imports: [BookDetailComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: BookService, useValue: books },
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id === null ? {} : { id }) } },
        },
      ],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(BookDetailComponent);
    component = fixture.componentInstance;
  }

  it('carga el libro por id', () => {
    setup('5');
    fixture.detectChanges();

    expect(books.getBook).toHaveBeenCalledWith(5);
    expect(component.book()).toEqual(book);
    expect(component.loading()).toBeFalse();
    expect(component.notFound()).toBeFalse();
  });

  it('marca no encontrado si el id no es válido', () => {
    setup('abc');
    fixture.detectChanges();

    expect(component.notFound()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(books.getBook).not.toHaveBeenCalled();
  });

  it('marca no encontrado si la carga falla', () => {
    setup('5');
    books.getBook.and.returnValue(throwError(() => ({ status: 404 })));

    fixture.detectChanges();

    expect(component.notFound()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });

  it('sabe quién puede gestionar libros', () => {
    setup('5', 'reader');
    expect(component.canManageBooks()).toBeFalse();
  });

  it('abre y cierra el modal de borrado', () => {
    setup('5');
    fixture.detectChanges();

    component.confirmDelete();
    expect(component.showDeleteModal()).toBeTrue();

    component.cancelDelete();
    expect(component.showDeleteModal()).toBeFalse();
  });

  it('borra el libro y vuelve al catálogo', () => {
    setup('5');
    fixture.detectChanges();

    component.confirmDelete();
    component.executeDelete();

    expect(books.deleteBook).toHaveBeenCalledWith(5);
    expect(component.showDeleteModal()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
  });

  it('cierra el modal si el borrado falla', () => {
    setup('5');
    fixture.detectChanges();
    books.deleteBook.and.returnValue(throwError(() => ({ status: 403 })));

    component.confirmDelete();
    component.executeDelete();

    expect(component.showDeleteModal()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no borra si no hay libro cargado', () => {
    setup('5');
    fixture.detectChanges();
    component.book.set(null);

    component.executeDelete();

    expect(books.deleteBook).not.toHaveBeenCalled();
  });
});
