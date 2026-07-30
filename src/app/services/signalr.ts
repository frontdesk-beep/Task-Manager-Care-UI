import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Notification } from '../models/notification';

@Injectable({
  providedIn: 'root',
})
export class SignalrService {

  private hubConnection!: HubConnection;


  private notificationSubject =
    new BehaviorSubject<Notification[]>([]);


  notifications$ =
    this.notificationSubject.asObservable();



  constructor() { }



  startConnection() {

    this.hubConnection =
      new HubConnectionBuilder()
        .withUrl(
          `${environment.apiUrl}/taskHub`,
          {
            accessTokenFactory: () =>
              localStorage.getItem('token') ?? ''
          }
        )
        .withAutomaticReconnect()
        .build();



    this.receiveNotifications();



    this.hubConnection
      .start()
      .then(() => {
        console.log("SignalR connected");
      })
      .catch(err => {
        console.error("SignalR connection error", err);
      });

  }



  private receiveNotifications() {


    this.hubConnection.on(
      "ReceiveNotification",
      (notification: Notification) => {


        console.log(
          "New notification received",
          notification
        );


        const current =
          this.notificationSubject.value;



        this.notificationSubject.next(
          [
            notification,
            ...current
          ]
        );


      }
    );


  }



  getUnreadCount(): number {

    return this.notificationSubject.value
      .filter(x => !x.isRead)
      .length;

  }



  clearNotifications() {

    this.notificationSubject.next([]);

  }

}