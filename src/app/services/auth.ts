import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';
import { environment } from '../../environments/environment';
import { AnyCatcher } from 'rxjs/internal/AnyCatcher';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // backend URL
  authapi = `${environment.apiUrl}/auth`;
  usersapi = `${environment.apiUrl}/users`;
  constructor(
    private http: HttpClient,
    private storage: BrowserStorageService) { }

  login(data: any) {
    return this.http.post(`${this.authapi}/login`, data).pipe(
      tap((response: any) => {
        this.storage.setItem('token', response.token);
        this.storage.setItem('user', JSON.stringify({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
        }));
      })
    );
  }
  register(data: any) {
    return this.http.post(`${this.authapi}/register`, data);
  }
  forgotpassword(email: string) {
    return this.http.post(
      `${this.authapi}/forgot-password`,
      { email }
    );
  }
  resetPassword(token: string, newPassword: string) {
    return this.http.post(
      `${this.authapi}/reset-password`,
      { token, newPassword }
    )


  }
  getProfile(id: number) {
    return this.http.get(`${this.authapi}/profile/${id}`);
  }
  updateProfile(id: number, data: any) {
    return this.http.put(`${this.authapi}/profile/${id}`, data);
  }
  GetUsers() {
     const params: any = {
    page: '1',
    pageSize: '1000'
  };
    return this.http.get(`${this.usersapi}`, { params });
  }
  CreateUser(data: any) {
    return this.http.post(`${this.usersapi}`, data);
  }
  UpdateUser(id: number, data: any) {
    return this.http.put(`${this.usersapi}/${id}`, data);
  }
  DeleteUser(id: number) {
    return this.http.delete(`${this.usersapi}/${id}`);
  }
  DeactivateUser(id: number) {
    return this.http.delete(
      `${this.usersapi}/${id}`
    );
  }
  ReactivateUser(id: number) {
    return this.http.put(
      `${this.usersapi}/reactivate/${id}`,
      {}
    );
  }
  
  searchUsers(search: string = '', pageSize: number = 5) {
    const params: any = {
      pageSize: pageSize.toString(),
      page: '1'
    };
    if (search) {
      params.search = search;
    }
    return this.http.get(`${this.usersapi}`, { params });
  }

  //to get a superadmin role 
  getCurrentUserRole(): any {
    const user = this.storage.getItem('user');
    return user ? JSON.parse(user) : null;
    }

    get currentRole(): string | null {
      return this.getCurrentUserRole()?.role || null;
    }
  }
