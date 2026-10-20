import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionNoticeService } from './auth-notice.service';
import { AuthService, UserRole } from './auth.service';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const notice = inject(SessionNoticeService);
    const router = inject(Router);

    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    notice.show('No tienes permiso para esta acción');
    return router.parseUrl('/books');
  };
};
