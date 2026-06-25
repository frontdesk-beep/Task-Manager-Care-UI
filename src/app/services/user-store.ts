import { Injectable } from '@angular/core';
import { Auth } from './auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserStore {

  //behaviour subject means storres data and notifies everyone when data changes.
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();
  
  constructor(private auth:Auth){}

  loadUser(id: number){
      this.auth.getProfile(id)
        .subscribe({
          next:(user) =>
          {
            // access the updated data.-next method
            this.userSubject.next(user);
            // also update localstorage when user loads
            localStorage.setItem('user', JSON.stringify(user));
          }
        });
  }
  getCurrentUser()
  {
    return this.userSubject.value;
  }
  setUser(user:any){
    this.userSubject.next(user);
    localStorage.setItem('user',JSON.stringify(user));
  }
  clearUser()
  {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }
  updateUser(id: number, data:any)
  {
    return this.auth.updateProfile(id, data);
  }
}
