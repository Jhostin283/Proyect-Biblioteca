import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookCoverComponent } from './book-cover.component';

describe('BookCoverComponent', () => {
  let fixture: ComponentFixture<BookCoverComponent>;
  let component: BookCoverComponent;

  function create(inputs: { isbn: string; title: string; author?: string; size?: 'sm' | 'md' | 'lg' }): void {
    fixture = TestBed.createComponent(BookCoverComponent);
    fixture.componentRef.setInput('isbn', inputs.isbn);
    fixture.componentRef.setInput('title', inputs.title);
    fixture.componentRef.setInput('author', inputs.author ?? '');
    fixture.componentRef.setInput('size', inputs.size ?? 'md');
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('construye la URL de Open Library con el ISBN sin guiones', () => {
    create({ isbn: '978-0-306-40615-7', title: 'El Quijote' });

    expect(component.normalizedIsbn()).toBe('9780306406157');
    expect(component.coverUrl()).toBe(
      'https://covers.openlibrary.org/b/isbn/9780306406157-L.jpg',
    );
  });

  it('muestra el marcador con las iniciales mientras no carga', () => {
    create({ isbn: '9780306406157', title: 'cien años de soledad', author: 'García Márquez' });

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(component.loaded()).toBeFalse();
    expect(component.initials()).toBe('CA');
    expect(text).toContain('CA');
    expect(text).toContain('cien años de soledad');
  });

  it('considera ausente la portada cuando la imagen mide 1x1', () => {
    create({ isbn: '9780306406157', title: 'El Quijote' });

    component.onLoad({ target: { naturalWidth: 1 } } as unknown as Event);

    expect(component.failed()).toBeTrue();
    expect(component.loaded()).toBeFalse();
    expect(component.showImage()).toBeFalse();
  });

  it('muestra la portada cuando la imagen carga de verdad', () => {
    create({ isbn: '9780306406157', title: 'El Quijote', size: 'lg' });

    component.onLoad({ target: { naturalWidth: 320 } } as unknown as Event);
    fixture.detectChanges();

    expect(component.loaded()).toBeTrue();
    expect(component.showImage()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).not.toBeNull();
  });

  it('cae al marcador si la imagen da error', () => {
    create({ isbn: '9780306406157', title: 'El Quijote' });

    component.onError();

    expect(component.loaded()).toBeFalse();
    expect(component.failed()).toBeTrue();
  });

  it('mantiene el marcador si la imagen nunca termina de cargar', () => {
    create({ isbn: '9780306406157', title: 'El Quijote' });

    expect(component.loaded()).toBeFalse();
    expect(component.showImage()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('.cover__initials')).not.toBeNull();
  });

  it('no pide imagen sin ISBN y usa "?" como inicial', () => {
    create({ isbn: '', title: '   ' });

    expect(component.showImage()).toBeFalse();
    expect(component.initials()).toBe('?');
  });
});
