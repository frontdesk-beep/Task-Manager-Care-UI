import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { ToastrService } from 'ngx-toastr';
import { UserStore } from '../../services/user-store';
import { TaskStore } from '../../services/task-store.service';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { NotificationService } from '../../services/notification';
import { TimeAgoPipe } from '../../pipes/time-ago-pipe';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-header-top',
  imports: [CommonModule, RouterLink, TimeAgoPipe],
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
    private toastr: ToastrService,
    private userStore: UserStore,
    private taskStore: TaskStore,
    private notificationService: NotificationService,
    private storage: BrowserStorageService,
    private auth: Auth
  ) { }

  ngOnInit(): void {

    this.userSubscription = this.userStore.user$.
      subscribe(user => {
        if (!user)
          return;
        this.name = user.name;
      });

    this.signalRSubscription =
      this.notificationService.notifications$
        .subscribe(notifications => {

          this.notifications = notifications;

          this.unreadCount =
            notifications.filter(
              x => !x.isRead).length;
        });
  }

  ngOnDestroy(): void {
    this.storeSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.signalRSubscription?.unsubscribe();
  }

  //check the superadmin role to hide the notification bell icon
  get isSuperAdmin(): boolean {
    return this.auth.currentRole === 'superAdmin' || this.auth.currentRole === 'SuperAdmin';
  }
  // collapses near-identical notifications fired within a few seconds of each other
  private dedupe(list: any[]): any[] {
    return list.filter((n, i) => {
      if (i === 0) return true;
      const prev = list[i - 1];
      const sameMessage = n.message === prev.message;
      const closeInTime =
        Math.abs(new Date(n.createdOn).getTime() - new Date(prev.createdOn).getTime()) < 5000;
      return !(sameMessage && closeInTime);
    });
  }
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  toggleNotifications() {
    this.notificationOpen = !this.notificationOpen;
  }
  markAllRead() {
    const unread = this.notifications.filter(x => !x.isRead);
    unread.forEach(n => {
      n.isRead = true;
      this.notificationService.markNotificationRead(n.id).subscribe({
        error: (err) => {
          console.log('Failed to mark notification read', err);
          n.isRead = false;
        }
      });
    });
    this.unreadCount = 0;
  }

  openNotification(n: any) {
    if (!n.isRead) {
      n.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notificationService.markNotificationRead(n.id).subscribe({
        error: (err) => {
          console.log('Failed to mark notification read', err);
          n.isRead = false;
          this.unreadCount++;
        }
      });
    }
    this.notificationOpen = false;
    if (n.taskId) {
      this.router.navigate(['/main', 'task', n.taskId]);
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'TaskAssigned': return 'bi-person-check';
      case 'TaskUpdated': return 'bi-pencil-square';
      case 'CommentAdded': return 'bi-chat-dots';
      default: return 'bi-bell';
    }
  }

  @HostListener('document:click')
  closeDropDown() {
    this.dropdownOpen = false;
    this.notificationOpen = false;
  }
  logout() {
    this.storage.removeItem('name');
    this.storage.removeItem('role');
    this.storage.removeItem('user');
    this.storage.removeItem('isLoggedIn');
    this.taskStore.destroy();
    this.storage.removeItem('token');
    this.notificationService.clearNotifications();
    this.notificationService.stopConnection();
    this.toastr.success('Logged out successfully!');
    this.router.navigate(['/login']);
  }
}
