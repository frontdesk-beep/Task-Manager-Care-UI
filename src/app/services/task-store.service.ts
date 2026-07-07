import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TaskService } from './task.service';
//Makes this service available throughout the application
@Injectable({ providedIn: 'root' })
export class TaskStore {
  //BahaviorSubject - Stores Data and automatically notifies componenents when data chnages.
  //These Store dashboard data.
  assignedTasks$ = new BehaviorSubject<any[]>([]);
  createdTasks$ = new BehaviorSubject<any[]>([]);
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

  constructor(private taskService: TaskService) {}
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
      this.pendingRefresh = true;
      return;
    }

    const start = performance.now();
    this.refreshInFlight = true;
    this.lastRefreshAt = Date.now();
    this.loading$.next(true);
    let remaining = 3;
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
      .GetTasksByAssignedTo(this.currentUserId)
      .pipe(
        catchError((err) => {
          console.log('Assigned API error', err);
          return of([]);
        })
      )
      .subscribe({
        next: (res: any) => {
          const assignedRaw = Array.isArray(res) ? res : (res?.data || []);
          const assignedTasks = assignedRaw.map((task: any) => ({
            ...task,
            assignedToId: Number(task.assignedToId),
            createdById: Number(task.createdById),
            statusId: Number(task.statusId),
            statusName: statusMap.get(Number(task.statusId)) || task.statusName || 'Unknown'
          }));

          this.assignedTasks$.next(assignedTasks);
        },
        error: (err) => {
          console.log('Assigned tasks subscription error', err);
        },
        complete
      });

    this.taskService
      .GetTasksByCreatedBy(this.currentUserId)
      .pipe(
        catchError((err) => {
          console.log('Created API error', err);
          return of([]);
        })
      )
      .subscribe({
        next: (res: any) => {
          const createdRaw = Array.isArray(res) ? res : (res?.data || []);
          const createdTasks = createdRaw.map((task: any) => ({
            ...task,
            assignedToId: Number(task.assignedToId),
            createdById: Number(task.createdById),
            statusId: Number(task.statusId),
            statusName: statusMap.get(Number(task.statusId)) || task.statusName || 'Unknown'
          }));

          this.createdTasks$.next(createdTasks);
        },
        error: (err) => {
          console.log('Created tasks subscription error', err);
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

    this.assignedTasks$.next(updateTasks(this.assignedTasks$.value));
    this.createdTasks$.next(updateTasks(this.createdTasks$.value));
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

    this.assignedTasks$.next([]);
    this.createdTasks$.next([]);
    this.statuses$.next([]);
    this.loading$.next(false);
    this.refreshInFlight = false;
    this.pendingRefresh = false;
  }
}
