import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'reader' | 'librarian' | 'admin';
  is_active: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);

  constructor(private readonly http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
  }

  hasRole(role: string): boolean {
    return this.currentUser()?.role === role;
  }

  login(email: string, password: string): Observable<UserProfile> {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password })
      .pipe(
        tap((response) => this.setToken(response.access_token)),
        switchMap(() => this.me()),
      );
  }

  register(email: string, fullName: string, password: string): Observable<UserProfile> {
    return this.http.post<UserProfile>('/api/auth/register', {
      email,
      full_name: fullName,
      password,
    });
  }

  me(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/auth/me').pipe(
      tap((profile) => this.currentUser.set(profile)),
    );
  }
}
