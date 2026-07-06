import {Component,OnInit,OnDestroy,ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Auth } from '../../services/auth';
import { TaskStore } from '../../services/task-store.service';


@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    RouterModule],
  templateUrl: './task-management.html',
  styleUrl: './task-management.css',
})
export class TaskManagement implements OnInit, OnDestroy {

  currentUserId = 0;
  completedStatusIds = new Set<number>();

  assignedTasks: any[] = [];
  createdTasks: any[] = [];
  users: any[] = [];
  statuses: any[] = [];

  storeSubs = new Subscription();

  pendingCount = 0;
  completedCount = 0;

  // Sorting state
  assignedSortKey: string = '';
  assignedSortDir: 'asc' | 'desc' = 'asc';
  createdSortKey: string = '';
  createdSortDir: 'asc' | 'desc' = 'asc';

  // Filtering state - Assigned to me table
  assignedByFilter: number | null = null;
  searchClientNameAssigned: string = '';

  // Filtering state - Created by me table
  createdStatusFilter: number | null = null;
  createdToFilter: number | null = null;
  searchClientNameCreated: string = '';

  // Pagination state
  assignedPage: number = 1;
  createdPage: number = 1;
  itemsPerPage: number = 5;

  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private taskStore: TaskStore,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {
    console.log('Dashboard constructor called');
  }

  ngOnInit() {
    console.log('Dashboard ngOnInit called');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = Number(user.id);

    console.log('Current user from localstorage:', user);
    console.log('Current user ID:', this.currentUserId);

    this.storeSubs.add(
      this.taskStore.assignedTasks$.subscribe((list: any[]) => {
        this.assignedTasks = Array.isArray(list) ? list : [];
        this.addNames();
      })
    );

    this.storeSubs.add(
      this.taskStore.createdTasks$.subscribe((list: any[]) => {
        this.createdTasks = Array.isArray(list) ? list : [];
        this.addNames();
      })
    );

    this.storeSubs.add(
      this.taskStore.statuses$.subscribe((list: any[]) => {
        this.statuses = Array.isArray(list) ? list : [];
        this.addNames();
      })
    );

    this.loadUsers();

    this.taskStore.initForUser(this.currentUserId);
  }

  ngOnDestroy() {
    console.log('Dashboard ngOnDestroy called');
    this.storeSubs.unsubscribe();
    this.taskStore.destroy();
  }

  loadUsers() {
    this.auth.GetUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res)
          ? res
          : (res?.data || []);

        console.log('Users count:', this.users.length);

        this.addNames();
      },
      error: (err) => {
        console.log('Users API error', err);
      }
    });
  }

  private isCompletedStatus(statusName: string | undefined): boolean {
    const normalized = String(statusName || '').toLowerCase();
    return normalized.includes('complete') ||
      normalized.includes('completed') ||
      normalized.includes('done') ||
      normalized.includes('closed');
  }

  private isCompletedStatusId(statusId: number): boolean {
    return this.completedStatusIds.has(statusId);
  }

  addNames() {
    const userMap = new Map<number, string>(
      this.users.map((user: any) => [
        Number(user.id),
        user.name
      ])
    );

    this.completedStatusIds = new Set(
      this.statuses
        .filter((status: any) =>
          this.isCompletedStatus(status.name || status.statusName)
        )
        .map((status: any) => Number(status.id))
    );

    const statusMap = new Map<number, string>(
      this.statuses.map((status: any) => [
        Number(status.id),
        status.name || status.statusName || ''
      ])
    );

    this.assignedTasks = this.assignedTasks
      .map((task: any) => ({
        ...task,
        assignedToId: Number(task.assignedToId),
        createdById: Number(task.createdById),
        statusId: Number(task.statusId),
        assignedToName:
          userMap.get(Number(task.assignedToId)) || 'Unknown',
        createdByName:
          userMap.get(Number(task.createdById)) || 'Unknown',
        statusName:
          statusMap.get(Number(task.statusId)) ||
          task.statusName ||
          'Unknown'
      }))
      .filter((task: any) =>
        !this.isCompletedStatus(task.statusName) &&
        !this.isCompletedStatusId(task.statusId)
      );

    this.createdTasks = this.createdTasks
      .map((task: any) => ({
        ...task,
        assignedToId: Number(task.assignedToId),
        createdById: Number(task.createdById),
        statusId: Number(task.statusId),
        assignedToName:
          userMap.get(Number(task.assignedToId)) || 'Unknown',
        createdByName:
          userMap.get(Number(task.createdById)) || 'Unknown',
        statusName:
          statusMap.get(Number(task.statusId)) ||
          task.statusName ||
          'Unknown'
      }))
      .filter((task: any) =>
        !this.isCompletedStatus(task.statusName) &&
        !this.isCompletedStatusId(task.statusId)
      );

    this.pendingCount = this.assignedTasks.filter((task: any) =>
      (task.statusName || '').toLowerCase().includes('pending')
    ).length;

    this.completedCount = this.assignedTasks.filter((task: any) =>
      this.isCompletedStatus(task.statusName) || 
    this.isCompletedStatusId(task.statusId)
    ).length;

    // this.cdr.detectChanges();
  }

  openTask(id: number) {
    this.router.navigate(['/main', 'task', id]).catch(err => {
      console.error('Router navigate error', err);
      window.location.href = `/main/task/${id}`;
    });
  }

  UpdateTask(task: any, statusId: number) {
    
    const nextStatusId = Number(statusId);
    console.log('Updating task', task.id, 'to status', nextStatusId);

    const prevStatus = task.statusId;
    const prevStatusName = task.statusName;

    task.statusId = nextStatusId;
    task.statusName = this.getStatusName(nextStatusId);

    this.addNames();

    const payload = {
      id: task.id,
      clientName: task.clientName,
      clientCategoryId: Number(task.clientCategoryId),
      phoneNumber: task.phoneNumber,
      email: task.email,
      assignedToId: Number(task.assignedToId),
      createdOn: task.createdOn,
      statusId: nextStatusId,
      task_Description: task.task_Description,
      priorityId: Number(task.priorityId),
      dueDate: task.dueDate,
      createdById: Number(task.createdById),
      serviceCategoryId: Number(task.serviceCategoryId)
    };
//patch
console.log(
  'Payload sent to API:',
  JSON.stringify(payload, null, 2)
);
    this.taskStore.UpdateTask(task.id, payload)
      .subscribe({
        next: (res: any) => {
          console.log('Task status saved successfully for', task.id, res);
          this.taskStore.refresh();
        },
        error: (err: any) => {
          console.log('Update failed, rolling back', err);

          task.statusId = prevStatus;
          task.statusName = prevStatusName;

          this.addNames();
        }
      });
  }

  getUserName(id: number) {
    const user = this.users.find((x: any) => Number(x.id) === Number(id));
    return user ? user.name : 'Unknown';
  }

  getStatusName(id: number) {
    const status = this.statuses.find((x: any) => Number(x.id) === Number(id));
    return status ? status.name : 'Unknown';
  }

  trackByTaskId(index: number, task: any) {
    return task.id;
  }

  // Sorting methods
  toggleSort(table: 'assigned' | 'created', key: string) {
    if (table === 'assigned') {
      if (this.assignedSortKey === key) {
        this.assignedSortDir = this.assignedSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.assignedSortKey = key;
        this.assignedSortDir = 'asc';
      }
    } else {
      if (this.createdSortKey === key) {
        this.createdSortDir = this.createdSortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.createdSortKey = key;
        this.createdSortDir = 'asc';
      }
    }
    this.cdr.detectChanges();
  }

  getSortIcon(table: 'assigned' | 'created', key: string): string {
    if (table === 'assigned') {
      if (this.assignedSortKey !== key) return '⇅';
      return this.assignedSortDir === 'asc' ? '↑' : '↓';
    } else {
      if (this.createdSortKey !== key) return '⇅';
      return this.createdSortDir === 'asc' ? '↑' : '↓';
    }
  }

  sortTasks(tasks: any[], table: 'assigned' | 'created'): any[] {
    const sortKey = table === 'assigned' ? this.assignedSortKey : this.createdSortKey;
    const sortDir = table === 'assigned' ? this.assignedSortDir : this.createdSortDir;

    if (!sortKey) return tasks;

    const sorted = [...tasks].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  // Filtering methods
  getFilteredAndSortedAssignedTasks(): any[] {
    console.log('called');
    let filtered = this.assignedTasks;

    // Filter by Created by (user)
    if (this.assignedByFilter !== null && this.assignedByFilter !== undefined) {
      filtered = filtered.filter(t => Number(t.createdById) === Number(this.assignedByFilter));
    }

    // Filter by Client Name (text search)
    if (this.searchClientNameAssigned.trim()) {
      const search = this.searchClientNameAssigned.trim().toLowerCase();
      filtered = filtered.filter(t => 
        (t.clientName || '').toLowerCase().includes(search)
      );
    }

    return this.sortTasks(filtered, 'assigned');
  }

  getFilteredAndSortedCreatedTasks(): any[] {
    let filtered = this.createdTasks;

    // Filter by Status
    if (this.createdStatusFilter !== null && this.createdStatusFilter !== undefined) {
      filtered = filtered.filter(t => Number(t.statusId) === Number(this.createdStatusFilter));
    }

    // Filter by Assigned to (user)
    if (this.createdToFilter !== null && this.createdToFilter !== undefined) {
      filtered = filtered.filter(t => Number(t.assignedToId) === Number(this.createdToFilter));
    }

    // Filter by Client Name (text search)
    if (this.searchClientNameCreated.trim()) {
      const search = this.searchClientNameCreated.trim().toLowerCase();
      filtered = filtered.filter(t => 
        (t.clientName || '').toLowerCase().includes(search)
      );
    }

    return this.sortTasks(filtered, 'created');
  }

  getPaginatedAssignedTasks(): any[] {
    const filtered = this.getFilteredAndSortedAssignedTasks();
    const start = (this.assignedPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  getPaginatedCreatedTasks(): any[] {
    const filtered = this.getFilteredAndSortedCreatedTasks();
    const start = (this.createdPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  getAssignedTotalPages(): number {
    return Math.ceil(this.getFilteredAndSortedAssignedTasks().length / this.itemsPerPage);
  }

  getCreatedTotalPages(): number {
    return Math.ceil(this.getFilteredAndSortedCreatedTasks().length / this.itemsPerPage);
  }

  goToAssignedPage(page: number) {
    const totalPages = this.getAssignedTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.assignedPage = page;
      // this.cdr.detectChanges();
    }
  }

  goToCreatedPage(page: number) {
    const totalPages = this.getCreatedTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.createdPage = page;
      // this.cdr.detectChanges();
    }
  }

  clearAllFilters() {
    this.assignedByFilter = null;
    this.searchClientNameAssigned = '';
    this.createdStatusFilter = null;
    this.createdToFilter = null;
    this.searchClientNameCreated = '';
    this.assignedPage = 1;
    this.createdPage = 1;
    // this.cdr.detectChanges();
  }

  getUniqueCreatedBy(): any[] {
    const unique = new Map<number, string>();
    this.assignedTasks.forEach(t => {
      const id = Number(t.createdById);
      if (id && t.createdByName) {
        unique.set(id, t.createdByName);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }

  getUniqueAssignedTo(): any[] {
    const unique = new Map<number, string>();
    this.createdTasks.forEach(t => {
      const id = Number(t.assignedToId);
      if (id && t.assignedToName) {
        unique.set(id, t.assignedToName);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }

  getCreatedStatusOptions(): any[] {
    return this.statuses.filter((status: any) => {
      const name = (status.name || status.statusName || '').toString().toLowerCase();
      return name === 'pending' || name === 'in progress' || name === 'in-progress';
    });
  }
}

