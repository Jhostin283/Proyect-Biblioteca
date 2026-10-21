import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AdminUser, UserService } from './user.service';

const adminUser: AdminUser = {
  id: 2,
  email: 'luis@correo.com',
  full_name: 'Luis',
  role: 'reader',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista usuarios con paginación y sin búsqueda', () => {
    service.list('', 1, 10).subscribe();

    const req = http.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush({ items: [adminUser], total: 1, page: 1, size: 10 });
  });

  it('lista usuarios con búsqueda', () => {
    service.list('luis', 2, 5).subscribe();

    const req = http.expectOne((r) => r.url === '/api/users');
    expect(req.request.params.get('q')).toBe('luis');
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ items: [], total: 0, page: 2, size: 5 });
  });

  it('actualiza rol o estado', () => {
    service.update(2, { is_active: false }).subscribe();

    const req = http.expectOne('/api/users/2');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush({ ...adminUser, is_active: false });
  });
});
