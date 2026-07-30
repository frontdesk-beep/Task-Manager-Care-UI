import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BrowserStorageService } from './browser-storage.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private api = `${environment.apiUrl}`;
  
  // private baseUrl = 'https://localhost:7148/api';
  private socket$: WebSocketSubject<any> | null = null;
  private commentsSocket$: WebSocketSubject<any> | null = null;

  constructor(
    private http: HttpClient,
    private storage: BrowserStorageService) { }

  private getAuthHeaders(): Record<string, string> {
    const token = this.storage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  CreateTask(data: any) {
    return this.http.post(`${this.api}/tasks`, data, {
      headers: this.getAuthHeaders()
    });
  }

  GetClientCategories() {
    return this.http.get(`${this.api}/clientcategories`, { headers: this.getAuthHeaders() });
  }

  GetClients() {
    return this.http.get(`${this.api}/client`, { headers: this.getAuthHeaders() });
  }

  GetClient(id: number) {
    return this.http.get(`${this.api}/client/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateClient(data: any) {
    return this.http.post(`${this.api}/client`, data, { headers: this.getAuthHeaders() });
  }

  UpdateClient(id: number, data: any) {
    return this.http.put(`${this.api}/client/${id}`, data, { headers: this.getAuthHeaders() });
  }

  DeleteClient(id: number) {
    return this.http.delete(`${this.api}/client/${id}`, { headers: this.getAuthHeaders() });
  }

  GetStatuses() {
    return this.http.get(`${this.api}/status`, { headers: this.getAuthHeaders() });
  }

  GetPriorities() {
    return this.http.get(`${this.api}/priority`, { headers: this.getAuthHeaders() });
  }

  GetServiceCategories() {
    return this.http.get(`${this.api}/servicescategories`, { headers: this.getAuthHeaders() });
  }

  GetNotifications(userId: number) {
    return this.http.get(`${this.api}/notifications`, {
      params: { userId: userId.toString() },
      headers: this.getAuthHeaders()
    });
  }

  MarkNotificationRead(notificationId: number) {
    return this.http.post(`${this.api}/notifications/${notificationId}/mark-read`, null, {
      headers: this.getAuthHeaders()
    });
  }

  GetAllTasks() {
    return this.http.get(`${this.api}/tasks`, {
      headers: this.getAuthHeaders()
    });
  }
  GetActiveTasks() {
  return this.http.get(`${this.api}/tasks/active`, {
    headers: this.getAuthHeaders()
  });
}

  GetTaskById(id: number) {
    return this.http.get(`${this.api}/tasks/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  GetComments(taskId: number) {
    return this.http.get(`${this.api}/tasks/${taskId}/comments`, {
      headers: this.getAuthHeaders()
    });
  }

  AddComment(taskId: number, data: any) {
    return this.http.post(`${this.api}/tasks/${taskId}/comments`, data, {
      headers: this.getAuthHeaders()
    });
  }

  UpdateTask(id: number, data: any) {
    return this.http.put(`${this.api}/tasks/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  PatchTask(id: number, data: any) {
    return this.http.patch(`${this.api}/tasks/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  connectTaskUpdates(userId: number): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      const apiHost = this.api.replace(/^https?:\/\//, '').replace(/\/api$/, '');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${wsProtocol}://${apiHost}/task-updates?userId=${userId}`;

      this.socket$ = webSocket({
        url,
        deserializer: ({ data }) => {
          try {
            return JSON.parse(data as string);
          } catch {
            return data;
          }
        }
      });
    }

    return this.socket$;
  }

  connectComments(taskId: number): Observable<any> {
    if (!this.commentsSocket$ || this.commentsSocket$.closed) {
      const apiHost = this.api.replace(/^https?:\/\//, '').replace(/\/api$/, '');
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${wsProtocol}://${apiHost}/task-comments?taskId=${taskId}`;

      this.commentsSocket$ = webSocket({
        url,
        deserializer: ({ data }) => {
          try {
            return JSON.parse(data as string);
          } catch {
            return data;
          }
        }
      });
    }

    return this.commentsSocket$;
  }

  disconnectComments() {
    this.commentsSocket$?.complete();
    this.commentsSocket$ = null;
  }

  disconnectTaskUpdates() {
    this.socket$?.complete();
    this.socket$ = null;
  }

  GetMySummary() {
    return this.http.get(`${this.api}/dashboard/my-summary`, { headers: this.getAuthHeaders() });
  }
  GetSummary() {
    return this.http.get(`${this.api}/dashboard/summary`, { headers: this.getAuthHeaders() });
  }
  GetHistory(taskId: number) {
    return this.http.get(

      this.api + '/Activity?taskId=' + taskId

    );
  }
 ReassignTask(taskId: number, data: any) {
  return this.http.put(`${this.api}/tasks/${taskId}/reassign`, data, {
    headers: this.getAuthHeaders()
  });
}

}
