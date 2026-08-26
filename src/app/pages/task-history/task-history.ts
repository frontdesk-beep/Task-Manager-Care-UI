import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RouterModule,
  Router
} from '@angular/router';
 
import { forkJoin } from 'rxjs';
 
import { TaskService } from '../../services/task.service';
import { Export, ExportColumn } from '../../services/export';
import { BrowserStorageService } from '../../services/browser-storage.service';
 
 
@Component({
  selector: 'app-task-history',
  standalone: true,
 
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
 
  templateUrl: './task-history.html',
  styleUrls: ['./task-history.css']
})
 
 
export class TaskHistory implements OnInit {
 
  // =========================================================
  // CURRENT USER
  // =========================================================
 
  currentUserId = 0;
 
 
  // =========================================================
  // DATA FROM BACKEND
  // =========================================================
 
  completedAssigned: any[] = [];
 
  completedCreated: any[] = [];
 
 
  // =========================================================
  // PAGE STATE
  // =========================================================
 
  loading = true;
 
  error: string | null = null;
 
 
  // =========================================================
  // SORTING
  // =========================================================
 
  assignedSortKey = '';
 
  assignedSortDir: 'asc' | 'desc' = 'asc';
 
  createdSortKey = '';
 
  createdSortDir: 'asc' | 'desc' = 'asc';
 
 
  // =========================================================
  // FILTERING
  // =========================================================
 
  assignedCreatedByFilter: number | null = null;
 
  assignedClientNameSearch = '';
 
  createdCreatedByFilter: number | null = null;
 
  createdClientNameSearch = '';
 
 
  // =========================================================
  // PAGINATION
  // =========================================================
 
  assignedPage = 1;
 
  createdPage = 1;
 
  readonly pageSize = 5;
 
 
  // =========================================================
  // CACHED VIEWS
  // (recomputed only when filters/sort/page actually change,
  // instead of on every Angular change-detection cycle - this
  // is what was causing lag with real data volumes)
  // =========================================================
 
  filteredAssignedTasks: any[] = [];
  paginatedAssignedTasks: any[] = [];
  assignedTotalPages = 1;
 
  filteredCreatedTasks: any[] = [];
  paginatedCreatedTasks: any[] = [];
  createdTotalPages = 1;
 
  uniqueAssignedCreators: any[] = [];
  uniqueCreatedCreators: any[] = [];
 
 
  // =========================================================
  // CONSTRUCTOR
  // =========================================================
 
  constructor(
    private taskService: TaskService,
    private router: Router,
    private exportService: Export,
    private cdr: ChangeDetectorRef,
    private storage: BrowserStorageService
  ) {}
 
 
  // =========================================================
  // INITIALIZE
  // =========================================================
 
  ngOnInit(): void {
 
    const userData = this.storage.getItem('user');
 
    if (!userData) {
 this.loading=false;
      this.error =
        'User not found. Please login again.';
 
      return;
    }
 
 
    try {
 
      const user = JSON.parse(userData);
 
      this.currentUserId =
        Number(user?.id || 0);
 
    } catch {
 
      this.currentUserId = 0;
 
    }
 
 
    if (!this.currentUserId) {
      this.loading=false;
 
      this.error =
        'Unable to determine current user. Please login again.';
 
      return;
    }
 
 
    this.loadHistory();
  }
 
 
  // =========================================================
  // LOAD HISTORY FROM BACKEND
  // =========================================================
 
  private loadHistory(): void {
  this.error = null;

  let showSkeletonTimer: any = setTimeout(() => {
    this.loading = true;
    this.cdr.markForCheck();
  }, 200); // only shows if the request is still pending after 200ms

  forkJoin({
    assigned: this.taskService.GetCompletedAssignedTasks(this.currentUserId),
    created: this.taskService.GetCompletedCreatedTasks(this.currentUserId)
  }).subscribe({
    next: ({ assigned, created }) => {
      clearTimeout(showSkeletonTimer);

      this.completedAssigned = this.extractArray(assigned);
      this.completedCreated = this.extractArray(created);

      this.assignedPage = 1;
      this.createdPage = 1;

      this.uniqueAssignedCreators = this.getUniqueCreatedByNames(this.completedAssigned);
      this.uniqueCreatedCreators = this.getUniqueCreatedByNames(this.completedCreated);
      this.refreshAssignedView();
      this.refreshCreatedView();

      this.loading = false;
      this.cdr.markForCheck();
    },

    error: (err) => {
      clearTimeout(showSkeletonTimer);

      console.error('Failed to load task history', err);
      this.error = 'Failed to load task history. Please try again.';
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}
  // =========================================================
  // HANDLE API RESPONSE
  // =========================================================
 
  private extractArray(response: any): any[] {
 
    if (Array.isArray(response)) {
 
      return response;
    }
 
    return response?.data || [];
  }
 
 
  // =========================================================
  // OPEN TASK
  // =========================================================
 
  openTask(id: number): void {
 
    this.router
      .navigate([
        '/main',
        'task',
        id
      ])
      .catch(err => {
 
        console.error(
          'Router navigate error:',
          err
        );
 
        window.location.href =
          `/main/task/${id}`;
      });
  }
 
 
  // =========================================================
  // SORTING
  // =========================================================
 
  toggleSort(
    table: 'assigned' | 'created',
    key: string
  ): void {
 
    if (table === 'assigned') {
 
      if (this.assignedSortKey === key) {
 
        this.assignedSortDir =
          this.assignedSortDir === 'asc'
            ? 'desc'
            : 'asc';
 
      } else {
 
        this.assignedSortKey = key;
 
        this.assignedSortDir = 'asc';
      }
 
    } else {
 
      if (this.createdSortKey === key) {
 
        this.createdSortDir =
          this.createdSortDir === 'asc'
            ? 'desc'
            : 'asc';
 
      } else {
 
        this.createdSortKey = key;
 
        this.createdSortDir = 'asc';
      }
    }

    if (table === 'assigned') {
      this.refreshAssignedView();
    } else {
      this.refreshCreatedView();
    }
  }
 
 
  getSortIcon(
    table: 'assigned' | 'created',
    key: string
  ): string {
 
    if (table === 'assigned') {
 
      if (this.assignedSortKey !== key) {
 
        return '⇅';
      }
 
      return this.assignedSortDir === 'asc'
        ? '↑'
        : '↓';
 
    } else {
 
      if (this.createdSortKey !== key) {
 
        return '⇅';
      }
 
      return this.createdSortDir === 'asc'
        ? '↑'
        : '↓';
    }
  }
 
 
  sortTasks(
    tasks: any[],
    table: 'assigned' | 'created'
  ): any[] {
 
    const sortKey =
      table === 'assigned'
        ? this.assignedSortKey
        : this.createdSortKey;
 
 
    const sortDir =
      table === 'assigned'
        ? this.assignedSortDir
        : this.createdSortDir;
 
 
    if (!sortKey) {
 
      return tasks;
    }
 
 
    const sorted = [...tasks].sort((a, b) => {
 
      let aVal = a[sortKey];
 
      let bVal = b[sortKey];
 
 
      if (typeof aVal === 'string') {
 
        aVal =
          aVal.toLowerCase();
      }
 
 
      if (typeof bVal === 'string') {
 
        bVal =
          bVal.toLowerCase();
      }
 
 
      if (aVal < bVal) {
 
        return sortDir === 'asc'
          ? -1
          : 1;
      }
 
 
      if (aVal > bVal) {
 
        return sortDir === 'asc'
          ? 1
          : -1;
      }
 
 
      return 0;
    });
 
 
    return sorted;
  }
 
 
  // =========================================================
  // FILTER ASSIGNED TASKS
  // =========================================================
 
  getFilteredAndSortedAssignedTasks(): any[] {
 
    let filtered =
      this.completedAssigned;
 
 
    // Created By filter
 
    if (
      this.assignedCreatedByFilter !== null &&
      this.assignedCreatedByFilter !== undefined
    ) {
 
      filtered =
        filtered.filter(task =>
          Number(task.createdById) ===
          Number(this.assignedCreatedByFilter)
        );
    }
 
 
    // Client search
 
    if (
      this.assignedClientNameSearch.trim()
    ) {
 
      const search =
        this.assignedClientNameSearch
          .trim()
          .toLowerCase();
 
 
      filtered =
        filtered.filter(task =>
          (task.clientName || '')
            .toString()
            .toLowerCase()
            .includes(search)
        );
    }
 
 
    return this.sortTasks(
      filtered,
      'assigned'
    );
  }
 
 
  // =========================================================
  // FILTER CREATED TASKS
  // =========================================================
 
  getFilteredAndSortedCreatedTasks(): any[] {
 
    let filtered =
      this.completedCreated;
 
 
    // Created By filter
 
    if (
      this.createdCreatedByFilter !== null &&
      this.createdCreatedByFilter !== undefined
    ) {
 
      filtered =
        filtered.filter(task =>
          Number(task.createdById) ===
          Number(this.createdCreatedByFilter)
        );
    }
 
 
    // Client search
 
    if (
      this.createdClientNameSearch.trim()
    ) {
 
      const search =
        this.createdClientNameSearch
          .trim()
          .toLowerCase();
 
 
      filtered =
        filtered.filter(task =>
          (task.clientName || '')
            .toString()
            .toLowerCase()
            .includes(search)
        );
    }
 
 
    return this.sortTasks(
      filtered,
      'created'
    );
  }
 
 
  // =========================================================
  // UNIQUE CREATED BY USERS
  // =========================================================
 
  getUniqueCreatedByNames(
    tasks: any[]
  ): any[] {
 
    const unique =
      new Map<number, string>();
 
 
    tasks.forEach(task => {
 
      const id =
        Number(task.createdById);
 
      const name =
        task.createdByName ||
        'Unknown';
 
 
      if (id && name) {
 
        unique.set(
          id,
          name
        );
      }
    });
 
 
    return Array.from(
      unique,
      ([id, name]) => ({
        id,
        name
      })
    );
  }
 
 
  // =========================================================
  // CACHED VIEW REFRESH
  // =========================================================
 
  refreshAssignedView(): void {
    this.filteredAssignedTasks = this.getFilteredAndSortedAssignedTasks();
    this.assignedTotalPages = Math.max(1, Math.ceil(this.filteredAssignedTasks.length / this.pageSize));
    this.assignedPage = Math.min(this.assignedPage, this.assignedTotalPages);
    this.paginateAssigned();
  }
 
  refreshCreatedView(): void {
    this.filteredCreatedTasks = this.getFilteredAndSortedCreatedTasks();
    this.createdTotalPages = Math.max(1, Math.ceil(this.filteredCreatedTasks.length / this.pageSize));
    this.createdPage = Math.min(this.createdPage, this.createdTotalPages);
    this.paginateCreated();
  }
 
  private paginateAssigned(): void {
    const start = (this.assignedPage - 1) * this.pageSize;
    this.paginatedAssignedTasks = this.filteredAssignedTasks.slice(start, start + this.pageSize);
  }
 
  private paginateCreated(): void {
    const start = (this.createdPage - 1) * this.pageSize;
    this.paginatedCreatedTasks = this.filteredCreatedTasks.slice(start, start + this.pageSize);
  }
 
 
  // =========================================================
  // FILTER EVENTS
  // =========================================================
 
  onAssignedFilterChange(): void {
 
    this.assignedPage = 1;
    this.refreshAssignedView();
  }
 
 
  onCreatedFilterChange(): void {
 
    this.createdPage = 1;
    this.refreshCreatedView();
  }
 
 
  // =========================================================
  // PAGINATION
  // =========================================================
 
  getAssignedTotalPages(): number {
 
    return Math.max(
      1,
      Math.ceil(
        this.getFilteredAndSortedAssignedTasks()
          .length / this.pageSize
      )
    );
  }
 
 
  getCreatedTotalPages(): number {
 
    return Math.max(
      1,
      Math.ceil(
        this.getFilteredAndSortedCreatedTasks()
          .length / this.pageSize
      )
    );
  }
 
 
  getPaginatedAssignedTasks(): any[] {
 
    const tasks =
      this.getFilteredAndSortedAssignedTasks();
 
 
    const start =
      (this.assignedPage - 1) *
      this.pageSize;
 
 
    return tasks.slice(
      start,
      start + this.pageSize
    );
  }
 
 
  getPaginatedCreatedTasks(): any[] {
 
    const tasks =
      this.getFilteredAndSortedCreatedTasks();
 
 
    const start =
      (this.createdPage - 1) *
      this.pageSize;
 
 
    return tasks.slice(
      start,
      start + this.pageSize
    );
  }
 
 
  goToAssignedPage(page: number): void {
 
    const total =
      this.getAssignedTotalPages();
 
 
    this.assignedPage =
      Math.max(
        1,
        Math.min(
          page,
          total
        )
      );

    this.paginateAssigned();
  }
 
 
  goToCreatedPage(page: number): void {
 
    const total =
      this.getCreatedTotalPages();
 
 
    this.createdPage =
      Math.max(
        1,
        Math.min(
          page,
          total
        )
      );

    this.paginateCreated();
  }
 
 
  // =========================================================
  // CLEAR FILTERS
  // =========================================================
 
  clearAllFilters(): void {
 
    this.assignedCreatedByFilter = null;
 
    this.assignedClientNameSearch = '';
 
    this.createdCreatedByFilter = null;
 
    this.createdClientNameSearch = '';
 
    this.assignedPage = 1;
 
    this.createdPage = 1;

    this.refreshAssignedView();
    this.refreshCreatedView();
  }
 
 
  // =========================================================
  // EXPORT COLUMNS
  // =========================================================
 
  private readonly assignedExportColumns:
    ExportColumn[] = [
 
      {
        key: 'createdByName',
        label: 'Created By'
      },
 
      {
        key: 'clientName',
        label: 'Client'
      },
 
      {
        key: 'task_Description',
        label: 'Description'
      },
 
      {
        key: 'dueDate',
        label: 'Due Date'
      }
 
    ];
 
 
  private readonly createdExportColumns:
    ExportColumn[] = [
 
      {
        key: 'clientName',
        label: 'Client'
      },
 
      {
        key: 'task_Description',
        label: 'Description'
      },
 
      {
        key: 'dueDate',
        label: 'Due Date'
      }
 
    ];
 
 
  // =========================================================
  // FORMAT DATE FOR EXPORT
  // =========================================================
 
  private withFormattedDueDate(
    tasks: any[]
  ): any[] {
 
    return tasks.map(task => ({
 
      ...task,
 
      dueDate:
        task.dueDate
          ? new Date(
              task.dueDate
            ).toLocaleDateString()
          : ''
 
    }));
  }
 
 
  // =========================================================
  // EXCEL EXPORT
  // =========================================================
 
  exportAssignedExcel(): void {
 
    const tasks =
      this.withFormattedDueDate(
        this.getFilteredAndSortedAssignedTasks()
      );
 
 
    this.exportService.exportExcel(
      tasks,
      'Completed_Assigned_Tasks_Export',
      this.assignedExportColumns
    );
  }
 
 
  exportCreatedExcel(): void {
 
    const tasks =
      this.withFormattedDueDate(
        this.getFilteredAndSortedCreatedTasks()
      );
 
 
    this.exportService.exportExcel(
      tasks,
      'Completed_Created_Tasks_Export',
      this.createdExportColumns
    );
  }
 
 
  // =========================================================
  // PDF EXPORT
  // =========================================================
 
  exportAssignedPdf(): void {
 
    const tasks =
      this.withFormattedDueDate(
        this.getFilteredAndSortedAssignedTasks()
      );
 
 
    this.exportService.exportPdf(
      tasks,
      'Completed_Assigned_Tasks_Export',
      this.assignedExportColumns
    );
  }
 
 
  exportCreatedPdf(): void {
 
    const tasks =
      this.withFormattedDueDate(
        this.getFilteredAndSortedCreatedTasks()
      );
 
 
    this.exportService.exportPdf(
      tasks,
      'Completed_Created_Tasks_Export',
      this.createdExportColumns
    );
  }
 
 
  // =========================================================
  // TRACK BY
  // =========================================================
 
  trackByUserId(
    index: number,
    item: any
  ): any {
 
    return item.id;
  }
 
 
  trackByTaskId(
    index: number,
    item: any
  ): any {
 
    return item.id;
  }
 
 
  // =========================================================
  // AVATAR
  // =========================================================
 
  private readonly avatarPalette = [
    '#7c3aed',
    '#2563eb',
    '#059669',
    '#d97706',
    '#db2777',
    '#0891b2'
  ];
 
 
  getInitials(name: string): string {
 
    if (!name) {
 
      return '?';
    }
 
 
    const parts =
      name.trim().split(/\s+/);
 
 
    const first =
      parts[0]?.[0] || '';
 
 
    const second =
      parts.length > 1
        ? parts[1][0]
        : '';
 
 
    return (
      first + second
    ).toUpperCase();
  }
 
 
  getAvatarColor(name: string): string {
 
    if (!name) {
 
      return this.avatarPalette[0];
    }
 
 
    let hash = 0;
 
 
    for (
      let i = 0;
      i < name.length;
      i++
    ) {
 
      hash =
        name.charCodeAt(i) +
        ((hash << 5) - hash);
    }
 
 
    return this.avatarPalette[
      Math.abs(hash) %
      this.avatarPalette.length
    ];
  }
 
 
  // =========================================================
  // STATUS CLASS
  // =========================================================
 
  getStatusClass(
    status: string
  ): string {
 
    const normalized =
      String(status || '')
        .toLowerCase()
        .replace(/\s+/g, '-');
 
 
    if (
      [
        'completed',
        'done',
        'closed'
      ].includes(normalized)
    ) {
 
      return 'status-completed';
    }
 
 
    if (
      [
        'in-progress',
        'inprogress'
      ].includes(normalized)
    ) {
 
      return 'status-in-progress';
    }
 
 
    if (
      [
        'pending',
        'todo',
        'open'
      ].includes(normalized)
    ) {
 
      return 'status-pending';
    }
 
 
    if (
      [
        'overdue',
        'blocked'
      ].includes(normalized)
    ) {
 
      return 'status-overdue';
    }
 
 
    return 'status-default';
  }
 
}