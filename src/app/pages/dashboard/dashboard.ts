import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
export class Dashboard implements OnInit, OnDestroy {
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

  //instead of calling methods into html created variables
  filteredAssignedTasks: any[] = [];
  paginatedAssignedTasks: any[] = [];

  filteredCreatedTasks: any[] = [];
  paginatedCreatedTasks: any[] = [];

  assignedTotalPages: number = 1;
  createdTotalPages: number = 1;

  uniqueCreatedUsers: any[] = [];
  uniqueAssignedUsers: any[] = [];

  createdStatusOptions: any[] = [];


  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private taskStore: TaskStore,
    private router: Router,
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
    console.log('Loading users...');
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
    this.refreshAssignedView();
    this.refreshCreatedView();
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

    this.refreshAssignedView();
    this.refreshCreatedView();

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
          this.addNames();
          this.refreshAssignedView();
          this.refreshCreatedView();
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
    if (table === 'assigned') {
      this.refreshAssignedView();
    }
    else {
      this.refreshCreatedView();
    }
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

  goToAssignedPage(page: number) {
    if (page < 1 || page > this.assignedTotalPages) {
      return;
    }
    this.assignedPage = page;
    this.refreshAssignedView();
  }

  goToCreatedPage(page: number) {
    if (page < 1 || page > this.createdTotalPages) {
      return;
    }
    this.createdPage = page;
    this.refreshCreatedView();
  }

  clearAllFilters() {
    this.assignedByFilter = null;
    this.searchClientNameAssigned = '';

    this.createdStatusFilter = null;
    this.createdToFilter = null;
    this.searchClientNameCreated = '';

    this.assignedPage = 1;
    this.createdPage = 1;

    this.refreshAssignedView();
    this.refreshCreatedView();
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

  // for assigned tasks, we want to refresh the view whenever filters or sorting change
  refreshAssignedView() {
    let filtered = [...this.assignedTasks];
    // Filter by Created By
    if (this.assignedByFilter != null) {
      filtered = filtered.filter(x =>
        Number(x.createdById) === Number(this.assignedByFilter)
      );
    }
    // Search
    if (this.searchClientNameAssigned.trim()) {
      const search =
        this.searchClientNameAssigned.toLowerCase();
      filtered = filtered.filter(x =>
        (x.clientName || '').toLowerCase().includes(search)
      );
    }
    // Sorting
    filtered = this.sortTasks(filtered, 'assigned');
    this.filteredAssignedTasks = filtered;
    this.assignedTotalPages =
      Math.max(1,
        Math.ceil(filtered.length / this.itemsPerPage));

    const start =
      (this.assignedPage - 1) * this.itemsPerPage;
    this.paginatedAssignedTasks =
      filtered.slice(start, start + this.itemsPerPage);
    this.uniqueCreatedUsers = this.getUniqueCreatedBy();
  }


  refreshCreatedView() {
    let filtered = [...this.createdTasks];
    // Filter by Status
    if (this.createdStatusFilter != null) {
      filtered = filtered.filter(task =>
        Number(task.statusId) === Number(this.createdStatusFilter)
      );
    }
    // Filter by Assigned To
    if (this.createdToFilter != null) {
      filtered = filtered.filter(task =>
        Number(task.assignedToId) === Number(this.createdToFilter)
      );
    }
    // Search by Client Name
    if (this.searchClientNameCreated.trim()) {
      const search = this.searchClientNameCreated
        .trim()
        .toLowerCase();
      filtered = filtered.filter(task =>
        (task.clientName || '')
          .toLowerCase()
          .includes(search)
      );
    }
    // Sorting
    filtered = this.sortTasks(filtered, 'created');
    // Save filtered list
    this.filteredCreatedTasks = filtered;
    // Pagination
    this.createdTotalPages =
      Math.max(1, Math.ceil(filtered.length / this.itemsPerPage));
    const start =
      (this.createdPage - 1) * this.itemsPerPage;
    this.paginatedCreatedTasks =
      filtered.slice(start, start + this.itemsPerPage);
    this.createdStatusOptions =
      this.getCreatedStatusOptions();

      this.uniqueAssignedUsers = this.getUniqueAssignedTo();
  }
}

