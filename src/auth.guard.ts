import {inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BrowserStorageService } from './app/services/browser-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const storage = inject(BrowserStorageService);
  const router = inject(Router);
  const token = storage.getItem('token');

  if(token)
    return true;
    
  router.navigate(['/login']);
  return false;
};