import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TaskService } from './task.service';

//Makes this service available throughout the application
@Injectable({ providedIn: 'root' })
export class TaskStore {
  //BahaviorSubject - Stores Data and automatically notifies componenents when data chnages.
  //These Store dashboard data.
  private tasksSubject = new BehaviorSubject<any[]>([]);
  private statusesSubject = new BehaviorSubject<any[]>([]);

  tasks$ = this.tasksSubject.asObservable();
  statuses$ = this.statusesSubject.asObservable();

  loading$ = new BehaviorSubject<boolean>(false);

  private pollingId: any;
  private refreshTimer: any;
  //subscription use for WebSocket subscriptions
  // private socketSub?: Subscription;
  private currentUserId = 0;
  private refreshInFlight = false;
  private pendingRefresh = false;
  private lastRefreshAt = 0;

  constructor(
    private taskService: TaskService,
  ) { }
  //called when dashboard loads.
  initForUser(userId: number) {
    if (!userId) {
      return;
    }

    this.currentUserId = userId;
    // this.stopPolling();
    this.loadAll();
    // this.startPolling();
  }

  private loadAll() {
    if (!this.currentUserId) {
      return;
    }
    // this.zone.run(() => {
      this.loading$.next(true);

      forkJoin({
        statuses: this.taskService.GetStatuses(),
        tasks: this.taskService.GetActiveTasks()
      }).subscribe({
        next: ({ statuses, tasks }: any) => {

          const mappedStatuses = Array.isArray(statuses)
            ? statuses.map((s: any) => ({
              id: Number(s.id),
              name: s.statusName || s.name || ''
            }))
            : [];

          const statusMap = new Map<number, string>();

          mappedStatuses.forEach((s: any) => {
            statusMap.set(s.id, s.name);
          });

          const mappedTasks = Array.isArray(tasks)
            ? tasks.map((task: any) => ({
              ...task,
              assignedToId: Number(task.assignedToId),
              createdById: Number(task.createdById),
              statusId: Number(task.statusId),
              statusName:
                statusMap.get(Number(task.statusId)) ||
                task.statusName ||
                'Unknown'
            }))
            : [];
          console.log('am I inside Angular zone right now:', (window as any).Zone?.current?.name);
         
          this.tasksSubject.next(mappedTasks);
          this.statusesSubject.next(mappedStatuses);

          console.log('TASKS LOADED:', mappedTasks.length);
        },

        error: (err) => {
          console.error('Dashboard loading failed:', err);
        },

        complete: () => {
          this.loading$.next(false);
        }
      });
    // });
  }
  UpdateTask(taskId: number, data: any) {
    return this.taskService.UpdateTask(taskId, data).pipe(
      catchError((err) => {
        console.log('UpdateTask failed, falling back to PatchTask', err);
        return of(null);
      })
    );
  }

  refresh() {
    this.loadAll();
  }

  forceRefresh(userId?: number) {
    if (userId) {
      this.currentUserId = userId;
    }

    this.loadAll();
  }

  private scheduleRefresh() {
    if (!this.currentUserId) {
      return;
    }

    if (this.refreshTimer) {
      return;
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      this.loadAll();
    }, 250);
  }

  private startPolling() {
    this.stopPolling();
    // this.pollingId = setInterval(() => this.scheduleRefresh(), 20000);
  }

  private stopPolling() {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  //Create WebSocket connection.
  destroy() {
    this.stopPolling();
    this.currentUserId = 0;
    this.tasksSubject.next([]);
    this.statusesSubject.next([]);
    this.loading$.next(false);
  }
}
