import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppComponent } from './app.component';
import { AuthService, UserProfile, UserRole } from './core/auth/auth.service';
import { SessionNoticeService } from './core/auth/auth-notice.service';

const profile: UserProfile = {
  id: 1,
  email: 'admin@correo.com',
  full_name: 'Admin',
  role: 'admin',
  is_active: true,
};

describe('AppComponent', () => {
  let auth: {
    currentUser: () => UserProfile | null;
    getToken: () => string | null;
    hasRole: (role: UserRole) => boolean;
    logout: jasmine.Spy;
  };
  let router: Router;

  function setup(user: UserProfile | null, token: string | null): void {
    auth = {
      currentUser: () => user,
      getToken: () => token,
      hasRole: (role) => user?.role === role,
      logout: jasmine.createSpy('logout'),
    };

    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  it('considera la sesión iniciada con usuario y token', () => {
    setup(profile, 'jwt');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isAuthenticated()).toBeTrue();
    expect(fixture.componentInstance.isAdmin()).toBeTrue();
  });

  it('no considera sesión sin token', () => {
    setup(profile, null);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isAuthenticated()).toBeFalse();
  });

  it('no es admin para otros roles', () => {
    setup({ ...profile, role: 'reader' }, 'jwt');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isAdmin()).toBeFalse();
  });

  it('muestra el aviso de sesión', () => {
    setup(null, null);
    const fixture = TestBed.createComponent(AppComponent);
    const notice = TestBed.inject(SessionNoticeService);
    notice.show('Tu sesión expiró');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tu sesión expiró');
  });

  it('cierra la sesión y va al login', () => {
    setup(profile, 'jwt');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    fixture.componentInstance.logout();

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
