import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateComponent } from './state.component';

describe('StateComponent', () => {
  let fixture: ComponentFixture<StateComponent>;
  let component: StateComponent;

  function create(variant: 'loading' | 'empty' | 'error', title = 'Título', message = ''): void {
    fixture = TestBed.createComponent(StateComponent);
    fixture.componentRef.setInput('variant', variant);
    fixture.componentRef.setInput('title', title);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('muestra título y mensaje', () => {
    create('empty', 'No hay libros', 'Registra el primero para empezar.');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No hay libros');
    expect(text).toContain('Registra el primero para empezar.');
  });

  it('usa role alert para el error', () => {
    create('error');

    const root = (fixture.nativeElement as HTMLElement).querySelector('.state');
    expect(root?.getAttribute('role')).toBe('alert');
  });

  it('muestra el indicador de carga', () => {
    create('loading');

    expect((fixture.nativeElement as HTMLElement).querySelector('.state__spinner')).not.toBeNull();
  });

  it('emite la acción del botón', () => {
    const spy = jasmine.createSpy('action');
    create('error');
    component.action.subscribe(spy);

    fixture.componentRef.setInput('actionLabel', 'Reintentar');
    fixture.detectChanges();
    ((fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalled();
  });
});
