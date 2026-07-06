import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { TaskService } from '../../services/task.service';
import { Auth } from '../../services/auth';
import { TaskStore } from '../../services/task-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  dashboardSummary: any;
    currentUserId = 0;

  recentTasks: any[] = [];

  notifications: any[] = [];

  // taskChart: any;
  constructor(
    private dashboardService: DashboardService
  ) { }

  ngOnInit() {
    console.log('Dashboard ngOnInit called');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    // const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = Number(user.id);

    this.dashboardService.GetSummary().subscribe(res => {
      this.dashboardSummary = res;
    });

    this.dashboardService.GetRecentTasks().subscribe(res => {
      this.recentTasks = res;
    });

    this.dashboardService.GetNotifications(user.id).subscribe(res => {
      this.notifications = res;
    });
  }
  loadSummary() {
    this.dashboardService.GetSummary().subscribe({
      next: (res: any) => {
        console.log('load summary called');
        this.dashboardSummary = res;
      },
      error: (err: any) => {
        console.log(err);
      }
    });
  }
  loadRecentTasks() {
    this.dashboardService.GetRecentTasks().subscribe({
      next: (res: any) => {
        console.log('load recent tasks called');
        this.recentTasks = res;
      },
      error: (err: any) => {
        console.log(err);
      }
    });
  }
  loadNotifications() {

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    this.dashboardService.GetNotifications(user.id)
      .subscribe({
        next: (res: any) => {
          console.log('load notifications called');
          this.notifications = res;
        },
        error: (err: any) => {
          console.log(err);
        }
      });

  }
  // this.loadTaskChart();

}
