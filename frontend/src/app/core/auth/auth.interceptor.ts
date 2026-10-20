import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { SessionNoticeService } from './auth-notice.service';
import { AuthService, SKIP_SESSION_REDIRECT } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notice = inject(SessionNoticeService);
  const router = inject(Router);
  const token = authService.getToken();

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.context.get(SKIP_SESSION_REDIRECT) &&
        !isLoginRequest(req.url)
      ) {
        authService.logout();
        notice.show('Tu sesión expiró');
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};

function isLoginRequest(url: string): boolean {
  return url.endsWith('/api/auth/login');
}
