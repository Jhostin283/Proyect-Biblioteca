import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionNoticeService } from '../../../core/auth/auth-notice.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <h2>Iniciar sesión</h2>

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
        <label for="email">Correo electrónico</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="email"
          placeholder="ana@correo.com"
        />
        <p class="field-error" *ngIf="form.controls.email.touched && form.controls.email.invalid">
          Introduce un correo electrónico válido.
        </p>

        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
          placeholder="Tu contraseña"
        />
        <p
          class="field-error"
          *ngIf="form.controls.password.touched && form.controls.password.invalid"
        >
          La contraseña es obligatoria.
        </p>

        <p class="form-error" role="alert" *ngIf="error()">{{ error() }}</p>

        <button type="submit" [disabled]="submitting()">
          {{ submitting() ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="auth-alt">
        ¿No tienes cuenta?
        <a routerLink="/register">Regístrate</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-container {
      max-width: 420px;
      margin: 3rem auto;
      padding: 0 1rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    h2 {
      color: #1e293b;
      margin: 1.5rem 1.5rem 0.5rem;
    }
    .auth-form {
      display: flex;
      flex-direction: column;
      padding: 0 1.5rem 1.5rem;
    }
    label {
      font-weight: 500;
      color: #334155;
      margin-top: 1rem;
      margin-bottom: 0.35rem;
    }
    input {
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 1rem;
    }
    input:focus {
      outline: 2px solid #2563eb;
      border-color: transparent;
    }
    .field-error {
      color: #b91c1c;
      font-size: 0.85rem;
      margin: 0.3rem 0 0;
    }
    .form-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 0.6rem 0.75rem;
      margin: 1rem 0 0;
      font-size: 0.95rem;
    }
    button {
      margin-top: 1.25rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: #1d4ed8;
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .auth-alt {
      border-top: 1px solid #e2e8f0;
      margin: 0;
      padding: 1rem 1.5rem;
      color: #475569;
      font-size: 0.95rem;
    }
    .auth-alt a {
      color: #2563eb;
      font-weight: 500;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notice = inject(SessionNoticeService);
  private readonly router = inject(Router);

  error = signal<string | null>(null);
  submitting = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notice.clear();
        this.router.navigate(['/books']);
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
    return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }
}
