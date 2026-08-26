import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private api = `${environment.apiUrl}`;
  
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
GetCompletedAssignedTasks(userId: number) {
  return this.http.get<any[]>(
    `${this.api}/Tasks/history/assigned?userId=${userId}`
  );
}

GetCompletedCreatedTasks(userId: number) {
  return this.http.get<any[]>(
    `${this.api}/Tasks/history/created?userId=${userId}`
  );
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

  
  GetMySummary() {
    return this.http.get(`${this.api}/dashboard/my-summary`, { headers: this.getAuthHeaders() });
  }
  GetSummary() {
    return this.http.get(`${this.api}/dashboard/summary`, { headers: this.getAuthHeaders() });
  }
  GetHistory(taskId: number) {
    return this.http.get(

      `${this.api}/Activity?taskId=${taskId}`,
      {headers: this.getAuthHeaders()}

    );
  }
 ReassignTask(taskId: number, data: any) {
  return this.http.put(`${this.api}/tasks/${taskId}/reassign`, data, {
    headers: this.getAuthHeaders()
  });
}

}
