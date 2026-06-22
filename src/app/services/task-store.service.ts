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
  //subscription use for WebSocket subscriptions
  private socketSub?: Subscription;
  private currentUserId = 0;

  constructor(private taskService: TaskService) {}
//called when dashboard loads.
  initForUser(userId: number) {
    console.log('TaskStore initForUser called:', userId);

    if (!userId) {
      console.log('No userId:', userId);
      return;
    }

    this.currentUserId = userId;

    console.log('Loading dashboard data');
    this.loadAll();
    this.startPolling();
    this.startRealtime();
  }

  private loadAll() {
    if (!this.currentUserId) {
      console.log('Cannot load tasks because currentUserId is missing');
      return;
    }

    const start = performance.now();
    this.loading$.next(true);
    let remaining = 3;
    const complete = () => {
      remaining -= 1;
      if (remaining === 0) {
        this.loading$.next(false);
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
    this.loadAll();
  }

  forceRefresh(userId?: number) {
    if (userId) {
      this.currentUserId = userId;
    }

    this.loadAll();
  }

  private startPolling() {
    this.stopPolling();
    this.pollingId = setInterval(() => this.loadAll(), 8000);
  }

  private stopPolling() {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }
//Create WebSocket connection.
  private startRealtime() {
    this.socketSub = this.taskService
      .connectTaskUpdates(this.currentUserId)
      .subscribe({
        next: (message: any) => {
          if (!message) return;

          if (
            message.type === 'task-created' ||
            message.type === 'task-updated'
          ) {
            this.loadAll();
          }
        },
        error: (err) => {
          console.log('TaskStore realtime error', err);
        }
      });
  }

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
  }
}
