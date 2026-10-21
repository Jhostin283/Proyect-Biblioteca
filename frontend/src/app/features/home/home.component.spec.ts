import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('muestra el estado cargando al arrancar', () => {
    fixture.detectChanges();

    expect(component.healthMessage()).toBe('Comprobando API...');
    expect(component.statusClass()).toBe('status-loading');
    http.expectOne('/api/health').flush({ status: 'ok' });
  });

  it('muestra el estado ok cuando la API responde', () => {
    fixture.detectChanges();

    http.expectOne('/api/health').flush({ status: 'ok' });

    expect(component.healthMessage()).toBe('API: ok');
    expect(component.statusClass()).toBe('status-ok');
  });

  it('muestra sin conexión si la API responde distinto', () => {
    fixture.detectChanges();

    http.expectOne('/api/health').flush({ status: 'degraded' });

    expect(component.healthMessage()).toBe('API: sin conexión');
    expect(component.statusClass()).toBe('status-error');
  });

  it('muestra sin conexión si la petición falla', () => {
    fixture.detectChanges();

    http.expectOne('/api/health').flush({}, { status: 500, statusText: 'Server Error' });

    expect(component.healthMessage()).toBe('API: sin conexión');
    expect(component.statusClass()).toBe('status-error');
  });
});
