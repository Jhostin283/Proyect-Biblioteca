import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, firstValueFrom, switchMap, tap } from 'rxjs';

import { SessionNoticeService } from './auth-notice.service';

export type UserRole = 'reader' | 'librarian' | 'admin';

export const SKIP_SESSION_REDIRECT = new HttpContextToken<boolean>(() => false);

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
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

  private readonly notice = inject(SessionNoticeService);

  constructor(private readonly http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null && this.getToken() !== null;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const role = this.currentUser()?.role;
    return role !== undefined && roles.includes(role);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.notice.clear();
  }

  async restoreSession(): Promise<void> {
    if (!this.getToken()) {
      this.currentUser.set(null);
      return;
    }

    try {
      await firstValueFrom(this.fetchProfile(true));
    } catch {
      this.logout();
    }
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
    return this.fetchProfile();
  }

  private fetchProfile(skipSessionRedirect = false): Observable<UserProfile> {
    const context = new HttpContext();
    if (skipSessionRedirect) {
      context.set(SKIP_SESSION_REDIRECT, true);
    }

    return this.http
      .get<UserProfile>('/api/auth/me', { context })
      .pipe(tap((profile) => this.currentUser.set(profile)));
  }
}
