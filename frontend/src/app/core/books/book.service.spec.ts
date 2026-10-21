import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Book, BookCreateInput, BookService } from './book.service';

const book: Book = {
  id: 3,
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

describe('BookService', () => {
  let service: BookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista libros sin parámetros', () => {
    service.getBooks().subscribe();

    const req = http.expectOne('/api/books');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ items: [book], total: 1, page: 1, size: 10 });
  });

  it('lista libros con búsqueda, género y paginación', () => {
    service.getBooks({ q: 'quijote', genre: 'Novela', page: 2, size: 5 }).subscribe();

    const req = http.expectOne(
      (r) => r.url === '/api/books' && r.params.get('q') === 'quijote',
    );
    expect(req.request.params.get('genre')).toBe('Novela');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('5');
    req.flush({ items: [book], total: 1, page: 2, size: 5 });
  });

  it('obtiene los géneros', () => {
    let result: string[] | undefined;
    service.getGenres().subscribe((genres) => (result = genres));

    http.expectOne('/api/books/genres').flush(['Novela']);
    expect(result).toEqual(['Novela']);
  });

  it('obtiene un libro por id', () => {
    let result: Book | undefined;
    service.getBook(3).subscribe((b) => (result = b));

    http.expectOne('/api/books/3').flush(book);
    expect(result).toEqual(book);
  });

  it('crea un libro', () => {
    const payload: BookCreateInput = {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      genre: book.genre,
      publication_year: book.publication_year,
    };

    service.createBook(payload).subscribe();

    const req = http.expectOne('/api/books');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(book);
  });

  it('actualiza un libro', () => {
    service.updateBook(3, { title: 'Otro' }).subscribe();

    const req = http.expectOne('/api/books/3');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Otro' });
    req.flush(book);
  });

  it('elimina un libro', () => {
    service.deleteBook(3).subscribe();

    const req = http.expectOne('/api/books/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
