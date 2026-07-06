import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {

  private api = "https://localhost:7148/api/Dashboard";

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  GetSummary(): Observable<any> {
    return this.http.get(`${this.api}/summary`, {
      headers: this.getHeaders()
    });
  }

  GetRecentTasks(): Observable<any> {
    return this.http.get(`${this.api}/recent-tasks`, {
      headers: this.getHeaders()
    });
  }

  GetNotifications(userId: number): Observable<any> {
    return this.http.get(`${this.api}/notifications/${userId}`, {
      headers: this.getHeaders()
    });
  }
}