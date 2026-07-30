import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { Auth } from '../../services/auth';
import { TaskStore } from '../../services/task-store.service';
import { ChangeDetectorRef } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgSelectModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  currentUserId = 0;
  completedStatusIds = new Set<number>();
  count = 0;
  //assigned to current user
  assignedTasks: any[] = [];

  tasks: any[] = [];
  users: any[] = [];
  statuses: any[] = [];
  allUsers:any[]=[];

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

  //dashboard cards - my summary
  assignedCount = 0;
  pendingCount = 0;
  completedCount = 0;
  overdueCount = 0;
  urgentCount = 0;

  //dashboard cards - all tasks summary
  allAssignedCount = 0;
  allPendingCount = 0;
  allCompletedCount = 0;
  allOverdueCount = 0;
  allUrgentCount = 0;

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

  showReassignModal = false;
  selectedTask: any = null;
  selectedUserId = 0;
  reassignRemarks = '';
  activeTab: 'mine' | 'all' = 'mine';

  userInput$ = new Subject<string>();
  usersLoading = false;

  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private taskStore: TaskStore,
    private router: Router,
    private storage: BrowserStorageService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private zone: NgZone,
    private ChangeDetectorRef: ChangeDetectorRef
  ) {
    console.log('Dashboard constructor called');
  }

  ngOnInit() {
    console.log('Dashboard ngOnInit called');
    if (!isPlatformBrowser(this.platformId)) {
      return; // skip all data loading on the server
    }

    const user = JSON.parse(this.storage.getItem('user') || '{}');
    this.currentUserId = Number(user.id);

    this.storeSubs.add(
      this.taskStore.tasks$.subscribe((tasks: any[]) => {
        console.log('5. DASHBOARD RECEIVED TASKS:', tasks);
        this.tasks = Array.isArray(tasks) ? tasks : [];
         this.rebuildTaskViews();
      })
    );

    this.storeSubs.add(
      this.taskStore.statuses$.subscribe((statuses: any[]) => {
        console.log('6. DASHBOARD RECEIVED STATUSES:', statuses);
        this.statuses = Array.isArray(statuses) ? statuses : [];
        this.rebuildTaskViews();
      })
    );

    this.loadUsers();
    this.setupUserSearch();

    // important - starts here
    this.taskStore.initForUser(this.currentUserId);
    this.loadSummary();
  }

  ngOnDestroy(): void {
    console.log('Dashboard ngOnDestroy called');
    this.storeSubs.unsubscribe();
    this.taskStore.destroy();
  }

  loadUsers() {
    console.log('Loading users...');
    this.auth.GetUsers().subscribe({
      next: (res: any) => {
       const data  = Array.isArray(res)
          ? res
          : (res?.data || []);

      this.allUsers = data;

      // users is used by the Reassign dropdown
      this.users = data;

      this.rebuildTaskViews();        
      this.ChangeDetectorRef.detectChanges();
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

        this.assignedCount = res.assignedTasks;
        this.pendingCount = res.pendingTasks;
        this.completedCount = res.completedTasks;
        this.overdueCount = res.overDueTasks;
        this.urgentCount = res.urgentTasks;
        this.ChangeDetectorRef.detectChanges();
      });

    this.taskService.GetSummary().subscribe((res: any) => {

      this.allAssignedCount = res.assignedTasks;
      this.allPendingCount = res.pendingTasks;
      this.allCompletedCount = res.completedTasks;
      this.allOverdueCount = res.overDueTasks;
      this.allUrgentCount = res.urgentTasks;
      this.ChangeDetectorRef.detectChanges();

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

  // addNames() {
  //   const userMap = new Map<number, string>(
  //     this.users.map((user: any) => [
  //       Number(user.id),
  //       user.name
  //     ])
  //   );
  //   const statusMap = new Map<number, string>(
  //     this.statuses.map((s: any) => [
  //       Number(s.id),
  //       s.name || s.statusName
  //     ])
  //   );
  //   this.completedStatusIds = new Set(
  //     this.statuses
  //       .filter((status: any) =>
  //         this.isCompletedStatus(status.name || status.statusName)
  //       )
  //       .map((status: any) => Number(status.id))
  //   );

  //   const mappedTasks = this.tasks.map(task => ({
  //     ...task,
  //     assignedToId: Number(task.assignedToId),
  //     createdById: Number(task.createdById),
  //     statusId: Number(task.statusId),

  //     assignedToName:
  //       userMap.get(Number(task.assignedToId)) || 'Unknown',

  //     createdByName:
  //       userMap.get(Number(task.createdById)) || 'Unknown',

  //     statusName:
  //       statusMap.get(Number(task.statusId))
  //       || task.statusName
  //       || 'Unknown'
  //   }));
  //   this.alltasks = mappedTasks;
  //   console.log('CURRENT USER ID:', this.currentUserId);

  //   console.table(mappedTasks.map(task => ({
  //     id: task.id,
  //     client: task.clientName,
  //     assignedToId: task.assignedToId,
  //     currentUserId: this.currentUserId,
  //     statusId: task.statusId,
  //     statusName: task.statusName,
  //     assignedMatch: Number(task.assignedToId) === this.currentUserId,
  //     completedByName: this.isCompletedStatus(task.statusName),
  //     completedById: this.isCompletedStatusId(task.statusId)
  //   })));

  //   //assigned to current user only
  //   this.assignedTasks = mappedTasks.filter(task =>
  //     Number(task.assignedToId) === this.currentUserId
  //     &&
  //     !this.isCompletedStatus(task.statusName)
  //     &&
  //     !this.isCompletedStatusId(task.statusId)
  //   );
  //   this.refreshAssignedView();
  //   this.refreshAllView();
  //   console.log('7. ALL TASKS:', this.alltasks);
  //   console.log('8. ASSIGNED TASKS:', this.assignedTasks);
  //   console.log('9. PAGINATED:', this.paginatedAssignedTasks);
  // }

  private mapTasks(): any[] {
  const userMap = new Map(
    this.allUsers.map(user => [
      Number(user.id),
      user.name
    ])
  );

  const statusMap = new Map(
    this.statuses.map(status => [
      Number(status.id),
      status.name || status.statusName
    ])
  );

  this.completedStatusIds = new Set(
    this.statuses
      .filter(status =>
        this.isCompletedStatus(status.name || status.statusName)
      )
      .map(status => Number(status.id))
  );

  return this.tasks.map(task => ({
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
  }));
}
private rebuildTaskViews(): void {
  const mappedTasks = this.mapTasks();

  this.alltasks = mappedTasks;

  this.assignedTasks = mappedTasks.filter(task =>
    Number(task.assignedToId) === this.currentUserId &&
    !this.isCompletedStatus(task.statusName) &&
    !this.isCompletedStatusId(task.statusId)
  );

  this.refreshAssignedView();
  this.refreshAllView();
}
  //for employee search dopdown- REASSIGN
  setupUserSearch() {
    this.userInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.usersLoading = true),
      switchMap((term: string) => this.auth.searchUsers(term))
    ).subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : (response?.data || []);
        this.users = data.map((user: any) => ({
          id: Number(user.id),
          name: user.name || user.email || `User ${user.id}`
        }));
        this.usersLoading = false;
      },
      error: (error: any) => {
        console.error('Error searching users:', error);
        this.usersLoading = false;
      }
    });
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
        this.refreshAssignedView();
      },
      error: err => {
        console.log(err);
      }
    });
  }

  // getUserName(id: number) {
  //   const user = this.users.find(x => Number(x.id) === Number(id));
  //   return user ? user.name : 'Unknown';
  // }
  // getStatusName(id: number) {
  //   const status = this.statuses.find(x => Number(x.id) === Number(id));
  //   return status ? status.name : 'Unknown';
  // }

  isOverdue(task: any): boolean {
  if (!task?.dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today &&
    !this.isCompletedStatus(task.statusName);
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


  // Turns "In Progress" -> "status-in-progress" to match a CSS class
  getStatusClass(statusName?: string): string {
    const clean = (statusName || 'unknown')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
    return 'status-' + clean;
  }

  // Turns "High" -> "priority-high" to match a CSS class
  getPriorityClass(priorityName?: string): string {
    const clean = (priorityName || 'medium')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');
    return 'priority-' + clean;
  }

  // "Sonia Shams" -> "SS", for the small avatar circle
  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  toggleMenu(task: any, event: MouseEvent) {
    // close others first (optional, if you want only one open at a time)
    this.tasks.forEach(t => { if (t !== task) t.showMenu = false; });

    task.showMenu = !task.showMenu;

    if (task.showMenu) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      task.menuOpensUp = spaceBelow < 150; // adjust threshold to your menu's height
    }
  }
  openReassign(task: any) {

    this.selectedTask = task;

    this.selectedUserId = task.assignedToId;

    this.reassignRemarks = '';

    this.showReassignModal = true;

  }
  closeReassign() {

    this.showReassignModal = false;

  }
  confirmReassign() {
    const payload = {
      assignedToId: this.selectedUserId,
      comment: this.reassignRemarks
    };
    this.taskService.ReassignTask(this.selectedTask.id, payload).subscribe({
      next: () => {
        this.taskStore.refresh();
        this.showReassignModal = false;
        this.selectedTask.showMenu = false;
      },
      error: (err) => {
        console.error('Reassign failed:', err);
      }
    });
  }

}
