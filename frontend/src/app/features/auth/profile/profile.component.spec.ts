import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { ProfileComponent } from './profile.component';

const profile: UserProfile = {
  id: 1,
  email: 'ana@correo.com',
  full_name: 'Ana',
  role: 'admin',
  is_active: true,
};

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let auth: jasmine.SpyObj<AuthService>;

  function setup(): void {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['me']);
    auth.me.and.returnValue(of(profile));

    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  }

  it('carga el perfil', () => {
    setup();
    fixture.detectChanges();

    expect(component.profile()).toEqual(profile);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('traduce los roles', () => {
    setup();
    fixture.detectChanges();

    expect(component.roleLabel('reader')).toBe('Lector');
    expect(component.roleLabel('librarian')).toBe('Bibliotecario');
    expect(component.roleLabel('admin')).toBe('Administrador');
  });

  it('ignora el 401 sin mostrar error', () => {
    setup();
    auth.me.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.loading()).toBeFalse();
  });

  it('muestra el detalle del error', () => {
    setup();
    auth.me.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'No encontrado' } })),
    );

    fixture.detectChanges();

    expect(component.error()).toBe('No encontrado');
  });

  it('une los mensajes de validación de un array', () => {
    setup();
    auth.me.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: [{ msg: 'Value error, dato inválido' }] },
          }),
      ),
    );

    fixture.detectChanges();

    expect(component.error()).toBe('dato inválido');
  });

  it('usa un mensaje genérico sin detalle', () => {
    setup();
    auth.me.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    fixture.detectChanges();

    expect(component.error()).toBe('No se pudo cargar el perfil. Inténtalo de nuevo.');
  });
});
