import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page page--narrow auth-page">
      <header class="auth-page__intro">
        <span class="page__eyebrow">Cuenta</span>
        <h1>Crear una cuenta</h1>
        <p class="page__subtitle">
          Regístrate para consultar el catálogo. Un administrador puede darte permisos de bibliotecario.
        </p>
      </header>

      <div class="card">
        <form [formGroup]="form" (ngSubmit)="submit()" class="card__body auth-form" novalidate>
          <div class="field">
            <label for="fullName">Nombre completo</label>
            <input id="fullName" type="text" formControlName="fullName" autocomplete="name" placeholder="Ana Pérez" />
            @if (form.controls.fullName.touched && form.controls.fullName.invalid) {
              <span class="field__error">El nombre es obligatorio.</span>
            }
          </div>

          <div class="field">
            <label for="email">Correo electrónico</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="ana@correo.com" />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <span class="field__error">Introduce un correo electrónico válido.</span>
            }
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              placeholder="Mínimo 8 caracteres, con letras y números"
            />
            <span class="field__hint">Al menos 8 caracteres, combinando letras y números.</span>
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <span class="field__error">La contraseña debe tener 8 caracteres con letras y números.</span>
            }
          </div>

          @if (error()) {
            <p class="alert alert--error" role="alert">{{ error() }}</p>
          }

          <button type="submit" class="btn" [disabled]="submitting()">
            {{ submitting() ? 'Creando cuenta…' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="card__footer auth-form__alt">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { padding-top: var(--space-7); }
    .auth-page__intro { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .auth-form .btn { margin-top: var(--space-2); }
    .auth-form__alt { font-size: var(--text-sm); color: var(--color-ink-soft); }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  error = signal<string | null>(null);
  submitting = signal(false);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[A-Za-z])(?=.*\d)/),
      ],
    ],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const { fullName, email, password } = this.form.getRawValue();

    this.auth.register(email, fullName, password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.error.set(this.errorDetail(err));
      },
    });
  }

  private errorDetail(err: HttpErrorResponse): string {
    const detail = err.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => String(item.msg ?? '').replace(/^Value error, /, ''))
        .filter(Boolean)
        .join('. ');
    }
    return 'No se pudo crear la cuenta. Inténtalo de nuevo.';
  }
}
