import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TaskService } from './task.service';


//Makes this service available throughout the application
@Injectable({ providedIn: 'root' })
export class TaskStore {
  //BahaviorSubject - Stores Data and automatically notifies componenents when data chnages.
  //These Store dashboard data.
  tasks$ = new BehaviorSubject<any[]>([]);
  statuses$ = new BehaviorSubject<any[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);

  private pollingId: any;
  private refreshTimer: any;
  //subscription use for WebSocket subscriptions
  private socketSub?: Subscription;
  private currentUserId = 0;
  private refreshInFlight = false;
  private pendingRefresh = false;
  private lastRefreshAt = 0;

  constructor(private taskService: TaskService) { }
  //called when dashboard loads.
  initForUser(userId: number) {
    if (!userId) {
      return;
    }

    this.currentUserId = userId;
    this.stopPolling();
    this.loadAll(true);
    this.startPolling();
  }

  private loadAll(force = false) {

    console.log('called');

    if (!this.currentUserId) {
      return;
    }

    if (!force && this.refreshInFlight) {
      this.pendingRefresh = true;
      return;
    }

    if (!force && Date.now() - this.lastRefreshAt < 4000) {
      // schedule a retry so this pending flag actually gets consumed
      if (!this.refreshTimer) {
        this.refreshTimer = setTimeout(() => {
          this.refreshTimer = null;
          if (this.pendingRefresh) {
            this.pendingRefresh = false;
            this.loadAll(true);
          }
        }, 4000 - (Date.now() - this.lastRefreshAt));
      }
      return;
    }

    const start = performance.now();
    this.refreshInFlight = true;
    this.lastRefreshAt = Date.now();
    this.loading$.next(true);
    
    let remaining = 2;
    const complete = () => {
      remaining -= 1;
      if (remaining === 0) {
        this.refreshInFlight = false;
        this.loading$.next(false);
        if (this.pendingRefresh) {
          this.pendingRefresh = false;
          this.loadAll(true);
        }
        console.log('Dashboard data loaded in', Math.round(performance.now() - start), 'ms');
      }
    };

    const statusMap = new Map<number, string>();

    this.taskService
      .GetStatuses()
      .pipe(
        catchError((err) => {
          console.log('Statuses API error', err);
          //when API crashes it ,instead of crashing,return an empty array.
          return of([]);
        })
      )
      .subscribe({
        next: (res: any) => {
          const statusesRaw = Array.isArray(res) ? res : (res?.data || []);
          const mappedStatuses = statusesRaw.map((s: any) => ({
            id: Number(s.id),
            name: s.statusName || s.name || ''
          }));

          mappedStatuses.forEach((s: any) => statusMap.set(s.id, s.name));
          this.statuses$.next(mappedStatuses);
          this.applyStatusNames(statusMap);
        },
        error: (err) => {
          console.log('Statuses subscription error', err);
        },
        complete
      });

    this.taskService
      .GetActiveTasks()
      .pipe(
        catchError(err => {
          console.log('Active Tasks API error', err);
          return of([]);
        })
      )
      .subscribe({
        next: (res: any) => {

          const tasksRaw = Array.isArray(res)
            ? res
            : (res?.data || []);

          const tasks = tasksRaw.map((task: any) => ({

            ...task,

            assignedToId: Number(task.assignedToId),

            createdById: Number(task.createdById),

            statusId: Number(task.statusId),

            statusName:
              statusMap.get(Number(task.statusId))
              || task.statusName
              || 'Unknown'

          }));

          this.tasks$.next(tasks);

        },

        complete
      });

  }
  private applyStatusNames(statusMap: Map<number, string>) {
    const updateTasks = (tasks: any[]) =>
      tasks.map((task: any) => ({
        ...task,
        statusName: statusMap.get(Number(task.statusId)) || task.statusName || 'Unknown'
      }));

    this.tasks$.next(updateTasks(this.tasks$.value));
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
    this.scheduleRefresh();
  }

  forceRefresh(userId?: number) {
    if (userId) {
      this.currentUserId = userId;
    }

    this.loadAll(true);
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
      this.loadAll(true);
    }, 250);
  }

  private startPolling() {
    this.stopPolling();
    this.pollingId = setInterval(() => this.scheduleRefresh(), 20000);
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
    //remove websocket connection.
    this.socketSub?.unsubscribe();
    //disconnect socket
    this.taskService.disconnectTaskUpdates();
    //clear
    this.currentUserId = 0;

    this.tasks$.next([]);
    this.statuses$.next([]);
    this.loading$.next(false);
    this.refreshInFlight = false;
    this.pendingRefresh = false;
  }
}
