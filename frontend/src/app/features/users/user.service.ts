import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserRole } from '../../core/auth/auth.service';

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  size: number;
}

export interface UserChanges {
  role?: UserRole;
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private readonly http: HttpClient) {}

  list(q: string, page: number, size: number): Observable<PaginatedUsers> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) {
      params = params.set('q', q);
    }
    return this.http.get<PaginatedUsers>('/api/users', { params });
  }

  update(id: number, changes: UserChanges): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`/api/users/${id}`, changes);
  }
}
