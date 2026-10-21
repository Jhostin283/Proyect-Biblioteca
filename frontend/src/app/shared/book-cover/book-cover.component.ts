import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type BookCoverSize = 'sm' | 'md' | 'lg';

const COVER_BASE_URL = 'https://covers.openlibrary.org/b/isbn';

/**
 * Portada de un libro resuelta en el navegador a partir del ISBN (Open Library).
 * El marcador local con las iniciales se pinta siempre debajo de la imagen y solo
 * desaparece cuando la portada carga de verdad; así una imagen que no existe o que
 * nunca responde deja el marcador a la vista. No hace peticiones a la API propia.
 */
@Component({
  selector: 'app-book-cover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="cover" [class]="'cover cover--' + size()" [class.cover--empty]="!loaded()">
      @if (showImage()) {
        <img
          class="cover__img"
          [src]="coverUrl()"
          [alt]="'Portada de ' + title()"
          [attr.loading]="lazy() ? 'lazy' : 'eager'"
          decoding="async"
          width="320"
          height="480"
          (load)="onLoad($event)"
          (error)="onError()"
        />
      }
      @if (!loaded()) {
        <span class="cover__fallback">
          <span class="cover__initials" aria-hidden="true">{{ initials() }}</span>
          <span class="cover__meta">
            <span class="cover__title">{{ title() }}</span>
            @if (author()) {
              <span class="cover__author">{{ author() }}</span>
            }
          </span>
        </span>
      }
    </figure>
  `,
  styles: [`
    .cover {
      position: relative;
      display: block;
      margin: 0;
      width: 96px;
      aspect-ratio: 2 / 3;
      border-radius: 8px;
      overflow: hidden;
      background: linear-gradient(160deg, #1f4d3f 0%, #163a30 60%, #0f2a23 100%);
      box-shadow: 0 6px 16px rgba(23, 32, 51, 0.18);
      flex: 0 0 auto;
    }
    .cover--sm { width: 56px; border-radius: 6px; }
    .cover--md { width: 96px; }
    .cover--lg { width: 160px; }
    .cover__img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cover__fallback {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8% 8% 10%;
      color: #f6f4ef;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: inherit;
      background-image: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25));
    }
    .cover__initials {
      font-family: 'Iowan Old Style', Palatino, Georgia, serif;
      font-weight: 600;
      font-size: clamp(1rem, 32cqi, 2.4rem);
      line-height: 1;
      margin-top: 18%;
      letter-spacing: 0.04em;
    }
    .cover__meta { display: flex; flex-direction: column; gap: 2px; }
    .cover__title {
      font-size: 0.6rem;
      font-weight: 600;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .cover__author { font-size: 0.55rem; opacity: 0.75; }
    .cover--sm .cover__title, .cover--sm .cover__author { display: none; }
    .cover--sm .cover__initials { margin-top: 30%; font-size: 1rem; }
  `]
})
export class BookCoverComponent {
  readonly isbn = input.required<string>();
  readonly title = input.required<string>();
  readonly author = input<string>('');
  readonly size = input<BookCoverSize>('md');
  readonly lazy = input<boolean>(true);

  readonly loaded = signal(false);
  readonly failed = signal(false);

  readonly normalizedIsbn = computed(() => this.isbn().replace(/[^0-9xX]/g, ''));
  readonly coverUrl = computed(
    () => `${COVER_BASE_URL}/${this.normalizedIsbn()}-L.jpg`,
  );
  readonly showImage = computed(
    () => this.normalizedIsbn().length > 0 && !this.failed(),
  );
  readonly initials = computed(() => {
    const words = this.title().trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (words.length === 0) {
      return '?';
    }
    return words.map((word) => word[0]).join('').toUpperCase();
  });

  onLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    // Open Library devuelve un GIF de 1x1 cuando no hay portada.
    if (!image.naturalWidth || image.naturalWidth <= 1) {
      this.failed.set(true);
      return;
    }
    this.loaded.set(true);
  }

  onError(): void {
    this.loaded.set(false);
    this.failed.set(true);
  }
}
