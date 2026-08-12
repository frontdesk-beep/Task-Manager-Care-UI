import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { Export } from '../../services/export';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-history.html',
  styleUrls: ['./task-history.css']
})
export class TaskHistory implements OnInit {
  currentUserId = 0;
  completedAssigned: any[] = [];
  completedCreated: any[] = [];
  loading = false;
  error: string | null = null;

  // Sorting state
  assignedSortKey: string = '';
  assignedSortDir: 'asc' | 'desc' = 'asc';
  createdSortKey: string = '';
  createdSortDir: 'asc' | 'desc' = 'asc';

  // Filtering state
  assignedCreatedByFilter: number | null = null;
  assignedClientNameSearch: string = '';
  createdCreatedByFilter: number | null = null;
  createdClientNameSearch: string = '';
  statuses: any[] = [];

  // Pagination state
  assignedPage = 1;
  createdPage = 1;
  readonly pageSize = 5;

  constructor(
    private taskService: TaskService,
    private router: Router,
    private exportService: Export,
    private ChangeDetectorRef: ChangeDetectorRef

  ) { }

  ngOnInit() {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.error = 'User not found. Please login again.';
      return;
    }

    try {
      const user = JSON.parse(userData);
      this.currentUserId = Number(user?.id || 0);
    } catch {
      this.currentUserId = 0;
    }

    if (!this.currentUserId) {
      this.error = 'Unable to determine current user. Please login again.';
      return;
    }

    this.loadHistory();
  }

  private extractArray(response: any): any[] {
    return Array.isArray(response) ? response : (response?.data || []);
  }

  private normalizeTask(task: any, statusMap: Map<number, string>) {
    return {
      ...task,
      assignedToId: Number(task.assignedToId),
      createdById: Number(task.createdById),
      statusId: Number(task.statusId),
      statusName: statusMap.get(Number(task.statusId)) || task.statusName || 'Unknown'
    };
  }

  private isCompletedStatus(statusName: string | undefined): boolean {
    const normalized = String(statusName || '').toLowerCase();
    return normalized.includes('complete') ||
      normalized.includes('completed') ||
      normalized.includes('done') ||
      normalized.includes('closed');
  }

  private createCompletedStatusSet(statuses: any[]): Set<number> {
    return new Set(
      statuses
        .filter((status: any) => this.isCompletedStatus(status.statusName || status.name))
        .map((status: any) => Number(status.id))
    );
  }

  private loadHistory() {
    this.loading = true;
    this.error = null;

    forkJoin({
      tasks: this.taskService.GetAllTasks(),
      statuses: this.taskService.GetStatuses()
    }).subscribe({
      next: ({ tasks, statuses }) => {
        const taskList = this.extractArray(tasks);
        const statusList = this.extractArray(statuses);
        this.statuses = statusList;

        const statusMap = new Map<number, string>(
          statusList.map((status: any) => [
            Number(status.id),
            status.statusName || status.name || ''
          ])
        );
        const completedStatusIds = this.createCompletedStatusSet(statusList);

        const mappedTasks = taskList.map((task: any) =>
          this.normalizeTask(task, statusMap)
        );

        this.completedAssigned = mappedTasks.filter(task =>
          Number(task.assignedToId) === this.currentUserId &&
          (
            completedStatusIds.has(task.statusId) ||
            this.isCompletedStatus(task.statusName)
          )
        );

        this.completedCreated = mappedTasks.filter(task =>
          Number(task.createdById) === this.currentUserId &&
          (
            completedStatusIds.has(task.statusId) ||
            this.isCompletedStatus(task.statusName)
          )
        );

        this.loading = false;
        this.ChangeDetectorRef.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load task history', err);
        this.error = 'Failed to load task history. Please try again.';
        this.loading = false;
      }
    });
  }


  openTask(id: number) {
    this.router.navigate(['/main', 'task', id]).catch(err => {
      console.error('Router navigate error', err);
      window.location.href = `/main/task/${id}`;
    });
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
    let filtered = this.completedAssigned;

    if (this.assignedCreatedByFilter !== null && this.assignedCreatedByFilter !== undefined) {
      filtered = filtered.filter(t => Number(t.createdById) === Number(this.assignedCreatedByFilter));
    }

    if (this.assignedClientNameSearch.trim()) {
      const search = this.assignedClientNameSearch.trim().toLowerCase();
      filtered = filtered.filter(t => (t.clientName || '').toString().toLowerCase().includes(search));
    }

    return this.sortTasks(filtered, 'assigned');
  }

  getFilteredAndSortedCreatedTasks(): any[] {
    let filtered = this.completedCreated;

    if (this.createdCreatedByFilter !== null && this.createdCreatedByFilter !== undefined) {
      filtered = filtered.filter(t => Number(t.createdById) === Number(this.createdCreatedByFilter));
    }

    if (this.createdClientNameSearch.trim()) {
      const search = this.createdClientNameSearch.trim().toLowerCase();
      filtered = filtered.filter(t => (t.clientName || '').toString().toLowerCase().includes(search));
    }

    return this.sortTasks(filtered, 'created');
  }

  getUniqueCreatedByNames(tasks: any[]): any[] {
    const unique = new Map<number, string>();
    tasks.forEach(t => {
      const id = Number(t.createdById);
      const name = t.createdByName || 'Unknown';
      if (id && name) {
        unique.set(id, name);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }

  onAssignedFilterChange() {
    this.assignedPage = 1;
  }

  onCreatedFilterChange() {
    this.createdPage = 1;
  }

  getAssignedTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredAndSortedAssignedTasks().length / this.pageSize));
  }

  getCreatedTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredAndSortedCreatedTasks().length / this.pageSize));
  }

  getPaginatedAssignedTasks(): any[] {
    const tasks = this.getFilteredAndSortedAssignedTasks();
    const start = (this.assignedPage - 1) * this.pageSize;
    return tasks.slice(start, start + this.pageSize);
  }

  getPaginatedCreatedTasks(): any[] {
    const tasks = this.getFilteredAndSortedCreatedTasks();
    const start = (this.createdPage - 1) * this.pageSize;
    return tasks.slice(start, start + this.pageSize);
  }

  goToAssignedPage(page: number) {
    const total = this.getAssignedTotalPages();
    this.assignedPage = Math.max(1, Math.min(page, total));
  }

  goToCreatedPage(page: number) {
    const total = this.getCreatedTotalPages();
    this.createdPage = Math.max(1, Math.min(page, total));
  }

  clearAllFilters() {
    this.assignedCreatedByFilter = null;
    this.assignedClientNameSearch = '';
    this.createdCreatedByFilter = null;
    this.createdClientNameSearch = '';
    this.assignedPage = 1;
    this.createdPage = 1;
  }

  exportAssignedExcel() {
    const tasks = this.getFilteredAndSortedAssignedTasks();
    this.exportService.exportExcel(tasks, 'Completed_Assigned_Tasks_Export');
  }

  exportCreatedExcel() {
    const tasks = this.getFilteredAndSortedCreatedTasks();
    this.exportService.exportExcel(tasks, 'Completed_Created_Tasks_Export');
  }

  exportCreatedPdf() {
    const tasks = this.getFilteredAndSortedCreatedTasks();
    this.exportService.exportPdf(tasks, 'Completed_Created_Tasks_Export');
  }

  exportAssignedPdf() {
    const tasks = this.getFilteredAndSortedAssignedTasks();
    this.exportService.exportPdf(tasks, 'Completed_Assigned_Tasks_Export');
  }

  trackByUserId(index: number, item: any): any {
    return item.id;
  }

  trackByTaskId(index: number, item: any): any {
    return item.id;
  }
  private readonly avatarPalette = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#db2777', '#0891b2'];

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts.length > 1 ? parts[1][0] : '';
    return (first + second).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!name) return this.avatarPalette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return this.avatarPalette[Math.abs(hash) % this.avatarPalette.length];
  }
  getStatusClass(status: string): string {
    const normalized = String(status || '').toLowerCase().replace(/\s+/g, '-');
    if (['completed', 'done', 'closed'].includes(normalized)) return 'status-completed';
    if (['in-progress', 'inprogress'].includes(normalized)) return 'status-in-progress';
    if (['pending', 'todo', 'open'].includes(normalized)) return 'status-pending';
    if (['overdue', 'blocked'].includes(normalized)) return 'status-overdue';
    return 'status-default';
  }
}