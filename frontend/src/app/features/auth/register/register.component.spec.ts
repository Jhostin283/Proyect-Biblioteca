import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { RegisterComponent } from './register.component';

const profile: UserProfile = {
  id: 1,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'reader',
  is_active: true,
};

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  function setup(): void {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['register']);
    auth.register.and.returnValue(of(profile));

    TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('exige nombre, correo y contraseña válida', () => {
    setup();

    component.form.setValue({ fullName: '', email: 'no-es-correo', password: 'corta' });

    expect(component.form.invalid).toBeTrue();
    expect(component.form.controls.password.hasError('minlength')).toBeTrue();

    component.submit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('exige letras y números en la contraseña', () => {
    setup();

    component.form.setValue({
      fullName: 'Ana',
      email: 'ana@correo.com',
      password: 'sololetras',
    });

    expect(component.form.controls.password.hasError('pattern')).toBeTrue();
  });

  it('registra la cuenta y va al login', () => {
    setup();
    component.form.setValue({
      fullName: 'Ana',
      email: 'ana@correo.com',
      password: 'secreta1',
    });

    component.submit();

    expect(auth.register).toHaveBeenCalledWith('ana@correo.com', 'Ana', 'secreta1');
    expect(component.submitting()).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('muestra el detalle de error en texto', () => {
    setup();
    component.form.setValue({
      fullName: 'Ana',
      email: 'ana@correo.com',
      password: 'secreta1',
    });
    auth.register.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { detail: 'El correo ya está registrado' } }),
      ),
    );

    component.submit();

    expect(component.error()).toBe('El correo ya está registrado');
  });

  it('une los mensajes de validación de un array', () => {
    setup();
    component.form.setValue({
      fullName: 'Ana',
      email: 'ana@correo.com',
      password: 'secreta1',
    });
    auth.register.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: [{ msg: 'Value error, correo duplicado' }, { msg: '' }] },
          }),
      ),
    );

    component.submit();

    expect(component.error()).toBe('correo duplicado');
  });

  it('usa un mensaje genérico sin detalle', () => {
    setup();
    component.form.setValue({
      fullName: 'Ana',
      email: 'ana@correo.com',
      password: 'secreta1',
    });
    auth.register.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.submit();

    expect(component.error()).toBe('No se pudo crear la cuenta. Inténtalo de nuevo.');
  });
});
