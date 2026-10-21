import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService, UserProfile } from './auth.service';
import { SessionNoticeService } from './auth-notice.service';

const profile: UserProfile = {
  id: 7,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'reader',
  is_active: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let notice: SessionNoticeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    notice = TestBed.inject(SessionNoticeService);
    localStorage.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('guarda y lee el token', () => {
    expect(service.getToken()).toBeNull();

    service.setToken('abc');

    expect(localStorage.getItem('token')).toBe('abc');
    expect(service.getToken()).toBe('abc');
  });

  it('no está autenticado sin usuario o sin token', () => {
    expect(service.isAuthenticated()).toBeFalse();

    service.setToken('abc');
    expect(service.isAuthenticated()).toBeFalse();

    service.currentUser.set(profile);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('consulta roles', () => {
    expect(service.hasRole('admin')).toBeFalse();

    service.currentUser.set(profile);

    expect(service.hasRole('reader')).toBeTrue();
    expect(service.hasRole('admin')).toBeFalse();
    expect(service.hasAnyRole(['admin', 'reader'])).toBeTrue();
    expect(service.hasAnyRole(['admin'])).toBeFalse();
    expect(service.hasAnyRole([])).toBeFalse();
  });

  it('logout limpia token, usuario y aviso', () => {
    service.setToken('abc');
    service.currentUser.set(profile);
    notice.show('mensaje');

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(notice.message()).toBeNull();
  });

  it('restoreSession sin token deja el usuario en null', async () => {
    service.currentUser.set(profile);

    await service.restoreSession();

    expect(service.currentUser()).toBeNull();
  });

  it('restoreSession recupera el perfil con token', async () => {
    service.setToken('abc');

    const promise = service.restoreSession();
    http.expectOne('/api/auth/me').flush(profile);
    await promise;

    expect(service.currentUser()).toEqual(profile);
  });

  it('restoreSession hace logout si el perfil falla', async () => {
    service.setToken('abc');

    const promise = service.restoreSession();
    http.expectOne('/api/auth/me').flush({ detail: 'x' }, { status: 401, statusText: 'Unauthorized' });
    await promise;

    expect(service.currentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
  });

  it('login guarda el token y carga el perfil', () => {
    let result: UserProfile | undefined;

    service.login('ana@correo.com', 'secreta').subscribe((user) => (result = user));

    const login = http.expectOne('/api/auth/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ email: 'ana@correo.com', password: 'secreta' });
    login.flush({ access_token: 'jwt', token_type: 'bearer', expires_in: 60 });

    expect(service.getToken()).toBe('jwt');

    http.expectOne('/api/auth/me').flush(profile);

    expect(result).toEqual(profile);
    expect(service.currentUser()).toEqual(profile);
  });

  it('register envía el alta', () => {
    let result: UserProfile | undefined;

    service.register('ana@correo.com', 'Ana', 'secreta1').subscribe((user) => (result = user));

    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      email: 'ana@correo.com',
      full_name: 'Ana',
      password: 'secreta1',
    });
    req.flush(profile);

    expect(result).toEqual(profile);
  });

  it('me actualiza el usuario actual', () => {
    service.me().subscribe();

    http.expectOne('/api/auth/me').flush(profile);

    expect(service.currentUser()).toEqual(profile);
  });
});
