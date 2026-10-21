import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { SessionNoticeService } from '../../../core/auth/auth-notice.service';
import { LoginComponent } from './login.component';

const profile: UserProfile = {
  id: 1,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'reader',
  is_active: true,
};

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;
  let notice: SessionNoticeService;

  function setup(): void {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    auth.login.and.returnValue(of(profile));

    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    router = TestBed.inject(Router);
    notice = TestBed.inject(SessionNoticeService);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('no envía el formulario vacío y marca los campos', () => {
    setup();

    component.submit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBeTrue();
  });

  it('inicia sesión y navega al catálogo', () => {
    setup();
    notice.show('aviso previo');
    component.form.setValue({ email: 'ana@correo.com', password: 'secreta' });

    component.submit();

    expect(auth.login).toHaveBeenCalledWith('ana@correo.com', 'secreta');
    expect(component.submitting()).toBeFalse();
    expect(notice.message()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/books']);
  });

  it('muestra el detalle de error en texto', () => {
    setup();
    component.form.setValue({ email: 'ana@correo.com', password: 'mala' });
    auth.login.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 401, error: { detail: 'Credenciales inválidas' } }),
      ),
    );

    component.submit();

    expect(component.error()).toBe('Credenciales inválidas');
    expect(component.submitting()).toBeFalse();
  });

  it('une los mensajes de validación de un array', () => {
    setup();
    component.form.setValue({ email: 'ana@correo.com', password: 'mala' });
    auth.login.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: [{ msg: 'Value error, formato inválido' }, { msg: 'otra cosa' }] },
          }),
      ),
    );

    component.submit();

    expect(component.error()).toBe('formato inválido. otra cosa');
  });

  it('usa un mensaje genérico sin detalle', () => {
    setup();
    component.form.setValue({ email: 'ana@correo.com', password: 'mala' });
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.submit();

    expect(component.error()).toBe('No se pudo iniciar sesión. Inténtalo de nuevo.');
  });
});
