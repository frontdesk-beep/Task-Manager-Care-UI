import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Auth } from '../../services/auth';
import { TaskStore } from '../../services/task-store.service';
import { ChangeDetectorRef } from '@angular/core';

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

  //assigned to current user
  assignedTasks: any[] = [];

  tasks: any[] = [];
  users: any[] = [];
  statuses: any[] = [];

  //FOR ALL TASKS
  alltasks: any[] = [];
  filteredAllTasks: any[] = [];
  paginatedAllTasks: any[] = [];
  searchAllClient = '';
  allPage = 1;
  allTotalPages = 1;
  allItemPerPage = 5;

  storeSubs = new Subscription();

  //FOR MY TASKS
  assignedPage: number = 1;
  assignedItemsPerPage = 5;
  assignedTotalPages = 1;
  filteredAssignedTasks: any[] = [];
  paginatedAssignedTasks: any[] = [];

  //dashboard cards
  assignedCount = 0;
  pendingCount = 0;
  completedCount = 0;
  overdueCount = 0;

  // Sorting state
  assignedSortKey: string = '';
  assignedSortDir: 'asc' | 'desc' = 'asc';

  // Filtering state - Assigned to me table
  assignedByFilter: number | null = null;
  searchClientNameAssigned: string = '';

  // Pagination state
  itemsPerPage: number = 5;

  //instead of calling methods into html created variables
  uniqueCreatedUsers: any[] = [];

  today = new Date();

  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private taskStore: TaskStore,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('Dashboard constructor called');
  }

  ngOnInit() {
    console.log('Dashboard ngOnInit called');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = Number(user.id);

    this.storeSubs.add(
      this.taskStore.tasks$.subscribe((tasks: any[]) => {
        this.tasks = Array.isArray(tasks) ? tasks : [];
        this.addNames();
      })
    );

    this.storeSubs.add(
      this.taskStore.statuses$.subscribe((statuses: any[]) => {
        this.statuses = Array.isArray(statuses) ? statuses : [];
        this.addNames();
      })
    );

    this.loadUsers();

    // important - starts here
    this.taskStore.initForUser(this.currentUserId);
    this.loadSummary();
  }

  ngOnDestroy(): void {
    console.log('Dashboard ngOnDestroy called');
    this.storeSubs.unsubscribe();
    // this.taskStore.destroy();
  }

  loadUsers() {
    console.log('Loading users...');
    this.auth.GetUsers().subscribe({
      next: (res: any) => {
        this.users = Array.isArray(res)
          ? res
          : (res?.data || []);
        this.addNames();
      },
      error: (err) => {
        console.log('Users API error', err);
      }
    });
  }
  loadSummary() {

    this.taskService.GetMySummary()
      .subscribe((res: any) => {
        console.log("Dashboard getsummary", res);
        this.assignedCount = res.openTasks;
        this.pendingCount = res.pendingTasks;
        this.completedCount = res.completedTasks;
        this.overdueCount = res.overDueTasks;
        console.log(this.pendingCount);
        console.log(this.completedCount);
        console.log(this.overdueCount);
        // this.cdr.detectChanges();
      });
  }
  private isCompletedStatus(statusName?: string): boolean {
    const s = (statusName || '').toLowerCase();
    return s.includes('complete') ||
      s.includes('completed') ||
      s.includes('done') ||
      s.includes('closed');
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
    const statusMap = new Map<number, string>(
      this.statuses.map((s: any) => [
        Number(s.id),
        s.name || s.statusName
      ])
    );
    this.completedStatusIds = new Set(
      this.statuses
        .filter((status: any) =>
          this.isCompletedStatus(status.name || status.statusName)
        )
        .map((status: any) => Number(status.id))
    );

    const mappedTasks = this.tasks.map(task => ({
      ...task,
      assignedToId: Number(task.assignedToId),
      createdById: Number(task.createdById),
      statusId: Number(task.statusId),

      assignedToName:
        userMap.get(Number(task.assignedToId)) || 'Unknown',

      createdByName:
        userMap.get(Number(task.createdById)) || 'Unknown',

      statusName:
        statusMap.get(Number(task.statusId))
        || task.statusName
        || 'Unknown'
    }));
    this.alltasks = mappedTasks;

    //assigned to current user only
    this.assignedTasks = mappedTasks.filter(task =>
      Number(task.assignedToId) === this.currentUserId
      &&
      !this.isCompletedStatus(task.statusName)
      &&
      !this.isCompletedStatusId(task.statusId)
    );
    this.refreshAssignedView();
    this.refreshAllView();

  }

  openTask(id: number) {
    this.router.navigate(['/main', 'task', id]).catch(err => {
      console.error(err);
      window.location.href = `/main/task/${id}`;
    });
  }

  UpdateTask(task: any, statusId: number) {

    const payload = {
      id: task.id,
      clientName: task.clientName,
      clientCategoryId: Number(task.clientCategoryId),
      phoneNumber: task.phoneNumber,
      email: task.email,
      assignedToId: Number(task.assignedToId),
      createdOn: task.createdOn,
      statusId: Number(statusId),
      task_Description: task.task_Description,
      priorityId: Number(task.priorityId),
      dueDate: task.dueDate,
      createdById: Number(task.createdById),
      serviceCategoryId: Number(task.serviceCategoryId)
    };
    this.taskStore.UpdateTask(task.id, payload).subscribe({
      next: () => {
        this.taskStore.refresh();
        this.loadSummary();
        // this.refreshAssignedView();
      },
      error: err => {
        console.log(err);
      }
    });
  }

  getUserName(id: number) {
    const user = this.users.find(x => Number(x.id) === Number(id));
    return user ? user.name : 'Unknown';
  }
  getStatusName(id: number) {
    const status = this.statuses.find(x => Number(x.id) === Number(id));
    return status ? status.name : 'Unknown';
  }

  isOverdue(task: any): boolean {
    if (!task.dueDate) {
      return false;
    }
    return new Date(task.dueDate) < this.today
      && !this.isCompletedStatus(task.statusName);
  }

  trackByTaskId(index: number, task: any) {
    return task.id;
  }

  toggleSort(key: string) {
    if (this.assignedSortKey === key) {
      this.assignedSortDir =
        this.assignedSortDir === 'asc'
          ? 'desc'
          : 'asc';
    }

    else {
      this.assignedSortKey = key;
      this.assignedSortDir = 'asc';
    }
    this.refreshAssignedView();
  }

  getSortIcon(key: string): string {
    if (this.assignedSortKey !== key)
      return '⇅';
    return this.assignedSortDir === 'asc'
      ? '↑'
      : '↓';
  }

  sortTasks(tasks: any[]): any[] {
    if (!this.assignedSortKey)
      return tasks;
    return [...tasks].sort((a, b) => {
      let aVal = a[this.assignedSortKey];
      let bVal = b[this.assignedSortKey];
      if (typeof aVal === 'string')
        aVal = aVal.toLowerCase();
      if (typeof bVal === 'string')
        bVal = bVal.toLowerCase();
      if (aVal < bVal)
        return this.assignedSortDir === 'asc'
          ? -1
          : 1;
      if (aVal > bVal)
        return this.assignedSortDir === 'asc'
          ? 1
          : -1;
      return 0;
    });
  }

  goToAssignedPage(page: number) {
    if (page < 1 || page > this.assignedTotalPages)
      return;
    this.assignedPage = page;
    this.refreshAssignedView();
  }
  goToAllPage(page: number) {

    if (page < 1 || page > this.allTotalPages) {
      return;
    }

    this.allPage = page;

    this.refreshAllView();
  }

  clearAllFilters() {
    this.assignedByFilter = null;
    this.searchClientNameAssigned = '';
    this.assignedPage = 1;
    this.refreshAssignedView();
  }
  clearAllTaskFilters() {
    this.searchAllClient = '';
    this.allPage = 1;
    this.refreshAllView();
  }
  getUniqueCreatedBy(): any[] {
    const unique = new Map<number, string>();
    this.assignedTasks.forEach(task => {
      const id = Number(task.createdById);
      if (id && task.createdByName) {
        unique.set(id, task.createdByName);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }


  //FOR MY TASKS
  refreshAssignedView() {
    let filtered: any[] = [...this.assignedTasks];
    if (this.assignedByFilter != null) {
      filtered = filtered.filter(task =>
        Number(task.createdById) === Number(this.assignedByFilter)
      );
    }
    if (this.searchClientNameAssigned.trim()) {
      const search = this.searchClientNameAssigned.toLowerCase();
      filtered = filtered.filter(task =>
        (task.clientName || '')
          .toLowerCase()
          .includes(search)
      );
    }
    filtered = this.sortTasks(filtered);
    this.filteredAssignedTasks = filtered;
    this.assignedTotalPages = Math.max(
      1,
      Math.ceil(filtered.length / this.assignedItemsPerPage)
    );
    const start =
      (this.assignedPage - 1) * this.assignedItemsPerPage;
    this.paginatedAssignedTasks =
      filtered.slice(start, start + this.assignedItemsPerPage);
    this.uniqueCreatedUsers =
      this.getUniqueCreatedBy();
  }

  //FOR ALL TASKS
  refreshAllView() {

    let filtered: any[] = [...this.alltasks];

    if (this.searchAllClient.trim()) {
      const search = this.searchAllClient.toLowerCase();

      filtered = filtered.filter(task =>
        (task.clientName || '').toLowerCase().includes(search)
      );
    }

    this.filteredAllTasks = filtered;

    this.allTotalPages = Math.max(
      1,
      Math.ceil(filtered.length / this.allItemPerPage)
    );

    const start = (this.allPage - 1) * this.allItemPerPage;

    this.paginatedAllTasks =
      filtered.slice(start, start + this.allItemPerPage);
  }
}