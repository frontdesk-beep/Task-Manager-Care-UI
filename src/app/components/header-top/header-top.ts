import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { ToastrService } from 'ngx-toastr';
import { UserStore } from '../../services/user-store';
import { TaskStore } from '../../services/task-store.service';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { SignalrService } from '../../services/signalr';
import { NotificationService } from '../../services/notification';

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

  //for notifications
  notificationOpen = false;
  notifications: any[] = [];
  storeSubscription?: Subscription;
  unreadCount = 0;
  private userSubscription?: Subscription;
  private signalRSubscription?: Subscription;

  constructor(
    private router: Router,
    private taskService: TaskService,
    private toastr: ToastrService,
    private userStore: UserStore,
    private taskStore: TaskStore,
    private storage: BrowserStorageService,
    private signalService: SignalrService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    let userId = 0;

    this.userSubscription = this.userStore.user$.
      subscribe(user => {
        if (!user) 
          return;
        this.name = user.name;
        // userId = user.id;
        // this.loadNotifications(userId);
      });

    this.signalRSubscription =
      this.signalService.notifications$
        .subscribe(notifications => {

          this.notifications = notifications;

          this.unreadCount =
            notifications.filter(
              x => !x.isRead).length;

        });
  }
  // loadNotifications(userId: number) {
  //   this.storeSubscription =
  //     this.taskService.GetNotifications(userId).subscribe({
  //       next: (res: any) => {
  //         const list = Array.isArray(res)
  //           ? res
  //           : (res?.data || []);

  //         this.notifications = list;
  //         this.unreadCount =
  //           list.filter((x: any) => !x.isRead).length;
  //       },
  //       error: (err: any) => {
  //         console.log('Notification load failed', err);
  //         this.notifications = [];
  //         this.unreadCount = 0;
  //       }
  //     });
  // }


  ngOnDestroy(): void {
    this.storeSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.signalRSubscription?.unsubscribe();
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
        this.notificationService.markNotificationRead(n.id).subscribe({
          error: (err) => {
            console.log('Failed to mark notification read', err);
            n.isRead = false;
            this.unreadCount++;
          }
        });
      });
    }
  }
  @HostListener('document:click')
  closeDropDown() {
    this.dropdownOpen = false;
  }
  logout() {
    this.storage.removeItem('name');
    this.storage.removeItem('role');
    this.storage.removeItem('user');
    this.storage.removeItem('isLoggedIn');
    this.taskStore.destroy();
    this.storage.removeItem('token');
    this.toastr.success('Logged out successfully!');
    this.router.navigate(['/login']);
  }
}
