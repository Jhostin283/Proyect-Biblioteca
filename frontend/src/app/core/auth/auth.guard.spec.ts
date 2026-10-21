import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';

import { AuthService, UserProfile } from './auth.service';
import { SessionNoticeService } from './auth-notice.service';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';

const profile: UserProfile = {
  id: 1,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'librarian',
  is_active: true,
};

describe('guards de autenticación y roles', () => {
  let auth: AuthService;
  let router: Router;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    http = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('authGuard deja pasar con usuario y token', () => {
    auth.setToken('abc');
    auth.currentUser.set(profile);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('authGuard redirige a /login sin sesión', () => {
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('roleGuard deja pasar con un rol permitido', () => {
    auth.currentUser.set(profile);

    const guard = roleGuard(['librarian', 'admin']);
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('roleGuard avisa y redirige a /books sin permiso', () => {
    const notice = TestBed.inject(SessionNoticeService);
    auth.currentUser.set(profile);

    const guard = roleGuard(['admin']);
    const result = TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    expect((result as UrlTree).toString()).toBe('/books');
    expect(notice.message()).toBe('No tienes permiso para esta acción');
  });

  it('usa el Router real para construir la redirección', () => {
    expect(router.parseUrl('/login').toString()).toBe('/login');
  });
});
