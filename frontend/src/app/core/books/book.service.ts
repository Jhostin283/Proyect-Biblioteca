import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private http = inject(HttpClient);
  private baseUrl = '/api/books';

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
