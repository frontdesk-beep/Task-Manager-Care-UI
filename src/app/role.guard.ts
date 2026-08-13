import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './services/auth';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const role = auth.currentRole;

    if (role && allowedRoles.includes(role)) 
        return true;

    router.navigate(['/main/dashboard']);
    return false;
  };
}