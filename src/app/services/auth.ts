import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  // backend URL
  authurl = 'https://localhost:7148/api/auth';
  usersurl = 'https://localhost:7148/api/users';
  constructor(private http: HttpClient)
   {}
   login(data:any)
   {
    return this.http.post(`${this.authurl}/login`,data).pipe(
      tap((response: any) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
        }));
      })
    );
   }
   register(data:any)
    {
      return this.http.post(`${this.authurl}/register`,data);
    }
    forgotpassword(data:any)
    {
      return this.http.post(`${this.authurl}/forgot-password`,data);
    }
    getProfile(id:number)
    {
      return this.http.get(`${this.authurl}/profile/${id}`);
    }
    updateProfile(id:number,data:any)
    {
      return this.http.put(`${this.authurl}/profile/${id}`,data);
    }
    GetUsers()
    {
      return this.http.get(`${this.usersurl}`);
    }
    CreateUser(data:any)
    {
      return this.http.post(`${this.usersurl}`,data);
    }
    UpdateUser(id:number,data:any)
    {
      return this.http.put(`${this.usersurl}/${id}`,data);
    }
    DeleteUser(id:number)
    {
      return this.http.delete(`${this.usersurl}/${id}`);
    }
}
