///to generate the token everywhere.
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { BrowserStorageService } from './services/browser-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(BrowserStorageService);
  const router = inject(Router);
  const token = storage.getItem('token');

  // If token exists, add Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login')
        || req.url.includes('/auth/forgot-password')
        || req.url.includes('/auth/reset-password');
        
      if (err.status === 401) {
        storage.removeItem('token');
        storage.removeItem('user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};