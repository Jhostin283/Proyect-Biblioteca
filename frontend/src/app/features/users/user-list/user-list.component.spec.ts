import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService, UserProfile } from '../../../core/auth/auth.service';
import { AdminUser, UserService } from '../user.service';
import { UserListComponent } from './user-list.component';

const adminUser: AdminUser = {
  id: 2,
  email: 'luis@correo.com',
  full_name: 'Luis',
  role: 'reader',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
};

const current: UserProfile = {
  id: 1,
  email: 'admin@correo.com',
  full_name: 'Admin',
  role: 'admin',
  is_active: true,
};

describe('UserListComponent', () => {
  let fixture: ComponentFixture<UserListComponent>;
  let component: UserListComponent;
  let users: jasmine.SpyObj<UserService>;

  function setup(): void {
    users = jasmine.createSpyObj<UserService>('UserService', ['list', 'update']);
    users.list.and.callFake((q, page, size) =>
      of({ items: [adminUser], total: 12, page, size }),
    );
    users.update.and.returnValue(of({ ...adminUser, role: 'librarian' }));

    TestBed.configureTestingModule({
      imports: [UserListComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: users },
        { provide: AuthService, useValue: { currentUser: () => current } },
      ],
    });

    fixture = TestBed.createComponent(UserListComponent);
    component = fixture.componentInstance;
  }

  it('carga los usuarios al iniciar', () => {
    setup();
    fixture.detectChanges();

    expect(users.list).toHaveBeenCalledWith('', 1, 10);
    expect(component.users()).toEqual([adminUser]);
    expect(component.total()).toBe(12);
    expect(component.totalPages()).toBe(2);
    expect(component.currentUserId()).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  it('traduce los roles', () => {
    setup();
    fixture.detectChanges();

    expect(component.roleLabel('reader')).toBe('Lector');
    expect(component.roleLabel('librarian')).toBe('Bibliotecario');
    expect(component.roleLabel('admin')).toBe('Administrador');
  });

  it('busca y limpia la búsqueda', () => {
    setup();
    fixture.detectChanges();
    component.page.set(2);
    component.query = '  luis ';

    component.applySearch();
    expect(component.page()).toBe(1);
    expect(users.list).toHaveBeenCalledWith('luis', 1, 10);

    component.clearSearch();
    expect(component.query).toBe('');
    expect(users.list).toHaveBeenCalledWith('', 1, 10);
  });

  it('pagina solo dentro del rango', () => {
    setup();
    fixture.detectChanges();

    component.goToPage(2);
    expect(component.page()).toBe(2);

    component.goToPage(0);
    expect(component.page()).toBe(2);

    component.goToPage(99);
    expect(component.page()).toBe(2);
  });

  it('cambia el rol de un usuario', () => {
    setup();
    fixture.detectChanges();
    const select = { value: 'librarian' } as HTMLSelectElement;

    component.changeRole(adminUser, { target: select } as unknown as Event);

    expect(users.update).toHaveBeenCalledWith(2, { role: 'librarian' });
    expect(component.success()).toBe('Rol actualizado');
    expect(component.users()[0].role).toBe('librarian');
  });

  it('ignora el cambio si el rol es el mismo', () => {
    setup();
    fixture.detectChanges();

    component.changeRole(adminUser, { target: { value: 'reader' } } as unknown as Event);

    expect(users.update).not.toHaveBeenCalled();
  });

  it('revierte el selector y muestra el error del backend', () => {
    setup();
    fixture.detectChanges();
    users.update.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { detail: 'No puedes cambiarte el rol a ti mismo' },
          }),
      ),
    );
    const select = { value: 'admin' } as HTMLSelectElement;

    component.changeRole(adminUser, { target: select } as unknown as Event);

    expect(select.value).toBe('reader');
    expect(component.error()).toBe('No puedes cambiarte el rol a ti mismo');
  });

  it('usa un mensaje genérico si el error no trae detail', () => {
    setup();
    fixture.detectChanges();
    users.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));

    component.changeRole(adminUser, { target: { value: 'admin' } } as unknown as Event);

    expect(component.error()).toBe('No se pudo completar la operación. Inténtalo de nuevo.');
  });

  it('une los mensajes de validación en un array', () => {
    setup();
    fixture.detectChanges();
    users.update.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { detail: [{ msg: 'Value error, rol inválido' }, { msg: '' }] },
          }),
      ),
    );

    component.changeRole(adminUser, { target: { value: 'admin' } } as unknown as Event);

    expect(component.error()).toBe('rol inválido');
  });

  it('activa y desactiva un usuario', () => {
    setup();
    fixture.detectChanges();
    const checkbox = { checked: false } as HTMLInputElement;
    users.update.and.returnValue(of({ ...adminUser, is_active: false }));

    component.toggleActive(adminUser, { target: checkbox } as unknown as Event);

    expect(users.update).toHaveBeenCalledWith(2, { is_active: false });
    expect(component.success()).toBe('Usuario desactivado');
    expect(component.users()[0].is_active).toBeFalse();
  });

  it('avisa al activar un usuario', () => {
    setup();
    fixture.detectChanges();
    users.update.and.returnValue(of({ ...adminUser, is_active: true }));

    component.toggleActive(adminUser, { target: { checked: true } } as unknown as Event);

    expect(component.success()).toBe('Usuario activado');
  });

  it('revierte el interruptor si falla la desactivación', () => {
    setup();
    fixture.detectChanges();
    users.update.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'No puedes desactivar tu propia cuenta' } })),
    );
    const checkbox = { checked: false } as HTMLInputElement;

    component.toggleActive(adminUser, { target: checkbox } as unknown as Event);

    expect(checkbox.checked).toBeTrue();
    expect(component.error()).toBe('No puedes desactivar tu propia cuenta');
  });

  it('muestra el error al cargar la lista', () => {
    setup();
    users.list.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permiso' } })),
    );

    fixture.detectChanges();

    expect(component.error()).toBe('Sin permiso');
    expect(component.loading()).toBeFalse();
  });
});
