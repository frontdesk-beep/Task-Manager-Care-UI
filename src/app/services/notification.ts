import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { Notification } from '../models/notification';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

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
    private http: HttpClient
  ){}



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



    this.hubConnection
      .start()
      .then(() => {
        console.log("SignalR connected");
      })
      .catch(err => {
        console.log(err);
      });

  }



  markNotificationRead(id:number){

    return this.http.put(
      `${this.api}/${id}/read`,
      {}
    );

  }



  getUnreadCount(){

    return this.notifications.value
      .filter(x=>!x.isRead)
      .length;

  }

}