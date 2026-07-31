import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { BrowserStorageService } from './browser-storage.service';
import { TaskStore } from './task-store.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection!: HubConnection;

  private notifications =
    new BehaviorSubject<Notification[]>([]);
  notifications$ =
    this.notifications.asObservable();

  private api =
    `${environment.apiUrl}/Notifications`;

  constructor(
    private http: HttpClient,
    private storage: BrowserStorageService,
    private taskStore: TaskStore
  ) { }

  startConnection() {
    this.hubConnection =
      new HubConnectionBuilder()
        .withUrl(
          `${environment.hubUrl}`,
          {
            accessTokenFactory: () =>
              this.storage.getItem('token') ?? ''
          }
        )
        .withAutomaticReconnect()
        .build();


    this.hubConnection.on(
      "ReceiveNotification",
      (notification: Notification) => {
        const current =
          this.notifications.value;

        this.notifications.next([
          notification,
          ...current
        ]);

      });
    // keep everyone's task list live, not just the bell
    this.hubConnection.on('TaskCreated', () => {
      this.taskStore.refresh();
    });

    this.hubConnection.on('TaskAssigned', () => {
      this.taskStore.refresh();
    });

    this.hubConnection.on('TaskUpdated', () => {
      this.taskStore.refresh();
    });
    this.hubConnection
      .start()
      .then(() => {
        console.log("SignalR connected");
      })
      .catch(err => {
        console.log('SignalR connection error', err);
      });
  }

  stopConnection() {
    this.hubConnection?.stop();
  }
  loadNotifications() {
    this.http.get<Notification[]>(this.api)
      .subscribe(list => this.notifications.next(list));
  }
  markNotificationRead(id: number) {
    return this.http.post(`${this.api}/${id}/mark-read`, {});
  }

  getUnreadCount(): number {
    return this.notifications.value.filter(x => !x.isRead).length;
  }

  clearNotifications() {
    this.notifications.next([]);
  }
}




