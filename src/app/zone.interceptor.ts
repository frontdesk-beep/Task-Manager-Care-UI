// export interface ZoneInterceptor {}
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

// Ensures every HTTP response is delivered inside Angular's zone,
// regardless of whether zone.js successfully auto-patched XHR/fetch.
export const ZoneInterceptor: HttpInterceptorFn = (req, next) => {
  const zone = inject(NgZone);

  return new Observable(observer => {
    const sub = next(req).subscribe({
      next: (event) => zone.run(() => {
        console.log('inside interceptor zone.run:', (window as any).Zone?.current?.name);
        observer.next(event);
      }),
      error: (err) => zone.run(() => observer.error(err)),
      complete: () => zone.run(() => observer.complete())
    });
    return () => sub.unsubscribe();
  });
};