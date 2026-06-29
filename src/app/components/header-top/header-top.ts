import { Component, EventEmitter, Input, Output, OnInit, OnDestroy,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import {ToastrService} from 'ngx-toastr';
import { UserStore } from '../../services/user-store';

@Component({
  selector: 'app-header-top',
  imports: [CommonModule, RouterLink],
  templateUrl: './header-top.html',
  styleUrl: './header-top.css',
})
export class HeaderTop implements OnInit, OnDestroy {
  @Input() sidebarOpen = true;
  @Output() sidebarToggle = new EventEmitter<void>();

  name = '';
  dropdownOpen = false;
  notificationOpen = false;

  notifications: any[] = [];
  storeSubscription?: Subscription;
  unreadCount=0;

  constructor(
    private router: Router,
    private taskService: TaskService,
    private toastr: ToastrService,
    private cdr:ChangeDetectorRef,
    private userStore:UserStore
  ) { }

  ngOnInit(): void {

    let userId=0;
    this.userStore.user$.subscribe(user=>{
      if(!user) return;
      this.name=user.name;
      userId=user.id;
      this.loadNotifications(userId);
    });
  }
    loadNotifications (userId:number) {
      this.storeSubscription = 
      this.taskService.GetNotifications(userId).subscribe({
        next: (res: any) => {
          const list = Array.isArray(res)
          ? res
          : (res?.data || []);

          this.notifications = list;
          this.unreadCount=
                list.filter((x:any) => !x.isRead).length;
                // this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.log('Notification load failed', err);
          this.notifications = [];
          this.unreadCount=0;
        }
      });
    }
  

  ngOnDestroy(): void {
    this.storeSubscription?.unsubscribe();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleNotifications() {
    this.notificationOpen = !this.notificationOpen;
    if (this.notificationOpen) {
      const unread = this.notifications.filter(x => !x.isRead);

      unread.forEach((n) => {

        n.isRead = true;

        this.taskService.MarkNotificationRead(n.id).subscribe({
          error: (err) => {
            console.log('Failed to mark notification read', err);
            n.isRead = false;
            this.unreadCount++;
          }
        });
      });
    }
  }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.toastr.success('Logged out successfully!');
    this.router.navigate(['/login']);
  }
}
