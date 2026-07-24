import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private baseUrl = 'https://localhost:7148/api';
  private socket$: WebSocketSubject<any> | null = null;
  private commentsSocket$: WebSocketSubject<any> | null = null;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  CreateTask(data: any) {
    return this.http.post(`${this.baseUrl}/tasks`, data, {
      headers: this.getAuthHeaders()
    });
  }

  GetClientCategories() {
    return this.http.get(`${this.baseUrl}/clientcategories`, { headers: this.getAuthHeaders() });
  }

  GetClients() {
    return this.http.get(`${this.baseUrl}/client`, { headers: this.getAuthHeaders() });
  }

  GetClient(id: number) {
    return this.http.get(`${this.baseUrl}/client/${id}`, { headers: this.getAuthHeaders() });
  }

  CreateClient(data: any) {
    return this.http.post(`${this.baseUrl}/client`, data, { headers: this.getAuthHeaders() });
  }

  UpdateClient(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/client/${id}`, data, { headers: this.getAuthHeaders() });
  }

  DeleteClient(id: number) {
    return this.http.delete(`${this.baseUrl}/client/${id}`, { headers: this.getAuthHeaders() });
  }

  GetStatuses() {
    return this.http.get(`${this.baseUrl}/status`, { headers: this.getAuthHeaders() });
  }

  GetPriorities() {
    return this.http.get(`${this.baseUrl}/priority`, { headers: this.getAuthHeaders() });
  }

  GetServiceCategories() {
    return this.http.get(`${this.baseUrl}/servicescategories`, { headers: this.getAuthHeaders() });
  }

  GetNotifications(userId: number) {
    return this.http.get(`${this.baseUrl}/notifications`, {
      params: { userId: userId.toString() },
      headers: this.getAuthHeaders()
    });
  }

  MarkNotificationRead(notificationId: number) {
    return this.http.post(`${this.baseUrl}/notifications/${notificationId}/mark-read`, null, {
      headers: this.getAuthHeaders()
    });
  }

  GetAllTasks() {
    return this.http.get(`${this.baseUrl}/tasks`, {
      headers: this.getAuthHeaders()
    });
  }

  GetTaskById(id: number) {
    return this.http.get(`${this.baseUrl}/tasks/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  GetComments(taskId: number) {
    return this.http.get(`${this.baseUrl}/tasks/${taskId}/comments`, {
      headers: this.getAuthHeaders()
    });
  }

  AddComment(taskId: number, data: any) {
    return this.http.post(`${this.baseUrl}/tasks/${taskId}/comments`, data, {
      headers: this.getAuthHeaders()
    });
  }

  UpdateTask(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/tasks/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  PatchTask(id: number, data: any) {
    return this.http.patch(`${this.baseUrl}/tasks/${id}`, data, {
      headers: this.getAuthHeaders()
    });
  }

  connectTaskUpdates(userId: number): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      const apiHost = this.baseUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
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
      const apiHost = this.baseUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
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
    return this.http.get(`${this.baseUrl}/dashboard/my-summary`, { headers: this.getAuthHeaders() });
  }
  GetSummary() {
    return this.http.get(`${this.baseUrl}/dashboard/summary`, { headers: this.getAuthHeaders() });
  }
  GetHistory(taskId: number) {
    return this.http.get(

      this.baseUrl + '/Activity?taskId=' + taskId

    );
  }
 ReassignTask(taskId: number, data: any) {
  return this.http.put(`${this.baseUrl}/tasks/${taskId}/reassign`, data, {
    headers: this.getAuthHeaders()
  });
}

}
