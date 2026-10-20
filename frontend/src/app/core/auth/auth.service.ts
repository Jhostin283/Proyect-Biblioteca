import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'reader' | 'librarian' | 'admin';
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<UserProfile | null>(null);

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
}
