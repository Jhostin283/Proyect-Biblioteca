import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SessionNoticeService } from './auth-notice.service';
import { AuthService, SKIP_SESSION_REDIRECT, UserProfile } from './auth.service';
import { authInterceptor } from './auth.interceptor';

const profile: UserProfile = {
  id: 1,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'admin',
  is_active: true,
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: AuthService;
  let router: Router;
  let notice: SessionNoticeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    notice = TestBed.inject(SessionNoticeService);
    localStorage.clear();
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  it('añade la cabecera Authorization cuando hay token', () => {
    auth.setToken('jwt');

    http.get('/api/books').subscribe();

    const req = controller.expectOne('/api/books');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
    req.flush([]);
  });

  it('no añade cabecera sin token', () => {
    http.get('/api/books').subscribe();

    const req = controller.expectOne('/api/books');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('ante un 401 cierra la sesión, avisa y navega a /login', () => {
    auth.setToken('jwt');
    auth.currentUser.set(profile);

    http.get('/api/books').subscribe({ error: () => undefined });

    controller
      .expectOne('/api/books')
      .flush({ detail: 'expirado' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.getToken()).toBeNull();
    expect(auth.currentUser()).toBeNull();
    expect(notice.message()).toBe('Tu sesión expiró');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('ignora el 401 cuando la petición pide saltar la redirección', () => {
    auth.setToken('jwt');

    http
      .get('/api/auth/me', { context: new HttpContext().set(SKIP_SESSION_REDIRECT, true) })
      .subscribe({ error: () => undefined });

    controller
      .expectOne('/api/auth/me')
      .flush({ detail: 'x' }, { status: 401, statusText: 'Unauthorized' });

    expect(notice.message()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('no redirige cuando el 401 viene del propio login', () => {
    auth.setToken('jwt');

    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });

    controller
      .expectOne('/api/auth/login')
      .flush({ detail: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
    expect(auth.getToken()).toBe('jwt');
  });

  it('deja pasar otros errores sin tocar la sesión', () => {
    auth.setToken('jwt');

    http.get('/api/books').subscribe({ error: () => undefined });

    controller.expectOne('/api/books').flush({}, { status: 500, statusText: 'Server Error' });

    expect(auth.getToken()).toBe('jwt');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
