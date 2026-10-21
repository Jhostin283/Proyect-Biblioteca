import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publication_year: number;
  description?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface BookCreateInput {
  isbn: string;
  title: string;
  author: string;
  genre: string;
  publication_year: number;
  description?: string | null;
}

export interface PaginatedBooks {
  items: Book[];
  total: number;
  page: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private http = inject(HttpClient);
  private baseUrl = '/api/books';

  getBooks(params?: { q?: string; genre?: string; page?: number; size?: number }): Observable<PaginatedBooks> {
    let httpParams = new HttpParams();
    if (params?.q) {
      httpParams = httpParams.set('q', params.q);
    }
    if (params?.genre) {
      httpParams = httpParams.set('genre', params.genre);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<PaginatedBooks>(this.baseUrl, { params: httpParams });
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/genres`);
  }

  getBook(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/${id}`);
  }

  createBook(book: BookCreateInput): Observable<Book> {
    return this.http.post<Book>(this.baseUrl, book);
  }

  updateBook(id: number, book: Partial<BookCreateInput>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/${id}`, book);
  }

  deleteBook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

