import {
  Component,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { TaskService } from '../../services/task.service';
// import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { UserStore } from '../../services/user-store';
import { ClientService } from '../../services/client.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

interface DropdownItem {
  id: number;
  name: string;
}

interface TaskItem {
  clientId: number | null;
  clientName: string;
  clientCategoryId: number;
  phoneNumber: string;
  email: string;
  assignedToId: number;
  createdOn: string;
  statusId: number;
  task_Description: string;
  priorityId: number;
  dueDate: string;
  createdById: number;
  serviceCategoryId: number;
}

@Component({
  selector: 'app-createtask',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,],
  templateUrl: './createtask.html',
  styleUrl: './createtask.css',
})
export class Createtask implements OnInit {

  @ViewChild('taskForm') taskForm!: NgForm;

  task: TaskItem = this.createEmptyTask();

  statuses: DropdownItem[] = [];
  priorities: DropdownItem[] = [];
  serviceCategories: DropdownItem[] = [];
  users: DropdownItem[] = [];
  clientCategoryId = 0;

  //for the clients dropdown
  clients: any[] = [];
  selectedClientId = 0;
  isExistingClient = false;
  clientTypes: DropdownItem[] = [];

  //FOR DROPDOWNS
  clientInput$ = new Subject<string>();
  clientsLoading = false;
  currentUserId = 0;
  userInput$ = new Subject<string>();
  usersLoading = false;


  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private toastr: ToastrService,
    private userStore: UserStore,
    private clientService: ClientService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
    this.setupUserSearch();
    this.loadClientTypes();
    this.loadStatuses();
    this.loadPriorities();
    this.loadServiceCategories();
    //for client dropdown filtering
    this.setupClientSearch();
    this.loadInitialClients();

  }
  // craete a brand new empty task object-instead of writing this.task ={clientname:'',phonenumber:''}
  // instead of writing evry field empty again and again create one seperate object which you can call.
  createEmptyTask(): TaskItem {
    const now = new Date();

    return {
      clientId: null,
      clientName: '',
      clientCategoryId: 0,
      phoneNumber: '',
      email: '',
      assignedToId: 0,
      createdOn: now.toISOString().slice(0, 16),
      statusId: 0,
      task_Description: '',
      priorityId: 0,
      dueDate: now.toISOString().slice(0, 10),
      createdById: 0,
      serviceCategoryId: 0
    };
  }

  private loadCurrentUser() {
    this.userStore.user$.subscribe(user => {
      if (!user) return;
      this.currentUserId = user.id;
      this.task.createdById = user.id;
    });
  }
  private extractArray(response: any): any[] {
    return Array.isArray(response)
      ? response
      : (response?.data || []);
  }

  private isActiveUser(user: any): boolean {
    const rawStatus = user?.isActive ?? user?.isactive ?? user?.active ?? user?.status;

    if (typeof rawStatus === 'boolean') {
      return rawStatus;
    }

    if (typeof rawStatus === 'number') {
      return rawStatus === 1;
    }

    if (typeof rawStatus === 'string') {
      const normalized = rawStatus.trim().toLowerCase();
      return ['active', 'true', '1', 'yes', 'y', 'enabled', 'enable'].includes(normalized);
    }

    return true;
  }

  loadStatuses() {
    this.taskService.GetStatuses().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.statuses = data.map((item: any) => ({
          id: Number(item.id),
          name: item.statusName || item.name || ''
        }));

      },
      error: (error) => {
        console.error('Error loading statuses:', error);
        this.toastr.error('Error loading statuses. Please try again.');
      }
    });
  }

  loadPriorities() {
    this.taskService.GetPriorities().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.priorities = data.map((item: any) => ({
          id: Number(item.id),
          name: item.priorityName || item.name || item.level || ''
        }));

      },
      error: (error) => {
        console.error('Error loading priorities:', error);
      }
    });
  }

  loadServiceCategories() {
    this.taskService.GetServiceCategories().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.serviceCategories = data.map((item: any) => ({
          id: Number(item.id),
          name: item.serviceName || item.name || item.categoryName || ''
        }));

      },
      error: (error) => {
        console.error('Error loading service categories:', error);
      }
    });
  }

  loadUsers() {
    this.auth.searchUsers('', 5).subscribe({
      next: (response: any) => {
        const users = this.extractArray(response).filter((user: any) => this.isActiveUser(user));

        this.users = users.map((user: any) => ({
          id: Number(user.id),
          name: user.name || user.email || `User ${user.id}`
        }));

      },
      error: (error) => {
        console.error('Error loading users for task assignment:', error);
      }
    });
  }

  loadInitialClients() {
    this.clientsLoading = true;
    this.clientService.searchClients('', 5).subscribe({
      next: (response: any) => {
        this.clients = this.extractArray(response);
        this.clientsLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading initial clients:', error);
        this.clientsLoading = false;
      }
    });
  }
  setupClientSearch() {
    this.clientInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.clientsLoading = true),
      switchMap(term => this.clientService.searchClients(term))
    ).subscribe({
      next: (response: any) => {
        this.clients = this.extractArray(response);
        this.clientsLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.clientsLoading = false;
      }
    });
  }

  //for employees dropdown
  setupUserSearch() {
    this.userInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.usersLoading = true),
      switchMap((term: string) => this.auth.searchUsers(term)) // this.auth, not this.userStore
    ).subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);
        this.users = data.map((user: any) => ({
          id: Number(user.id),
          name: user.name || user.email || `User ${user.id}`
        }));
        this.usersLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.usersLoading = false;
      }
    });
  }
  saveTask() {
    if (
      !this.task.clientName ||
      !this.task.email ||
      !this.task.phoneNumber ||
      !this.task.task_Description ||
      !this.task.clientCategoryId ||
      !this.task.assignedToId ||
      !this.task.statusId ||
      !this.task.priorityId ||
      !this.task.serviceCategoryId ||
      !this.task.dueDate
    ) {
      this.toastr.warning('Please fill in all required fields before creating the task.');
      return;
    }

    const payload = {
      clientId: this.selectedClientId == 0 ? null : this.selectedClientId,
      clientName: this.task.clientName,
      clientCategoryId: Number(this.task.clientCategoryId),
      phoneNumber: this.task.phoneNumber,
      email: this.task.email,
      assignedToId: Number(this.task.assignedToId),
      createdOn: this.task.createdOn,
      statusId: Number(this.task.statusId),
      task_Description: this.task.task_Description,
      priorityId: Number(this.task.priorityId),
      dueDate: this.task.dueDate,
      createdById: Number(this.task.createdById),
      serviceCategoryId: Number(this.task.serviceCategoryId)
    };

    this.taskService.CreateTask(payload).subscribe({
      next: () => {
        this.toastr.success('Task created successfully!');
        setTimeout(() => {
          this.resetTask();
        }, 0);
      },
      error: (error) => {
        console.error('Full Error:', error);
        const message = error?.error?.errors
          ? JSON.stringify(error.error.errors)
          : 'Error creating task. Please try again.';

        this.toastr.error(message);
      }
    });
    this.cdr.markForCheck();
  }

  resetTask() {
    this.selectedClientId = 0;
    this.isExistingClient = false;
    const now = new Date();

    this.taskForm.resetForm({
      clientName: '',
      clientCategoryId: 0,
      phoneNumber: '',
      email: '',
      assignedToId: 0,
      statusId: 0,
      task_Description: '',
      priorityId: 0,
      serviceCategoryId: 0,
      dueDate: now.toISOString().slice(0, 10),
      createdOn: now.toISOString().slice(0, 16),
      createdById: this.currentUserId
    })
    this.cdr.markForCheck();

  }
  onClientChange() {

    if (this.selectedClientId == 0) {
      this.isExistingClient = false;
      this.task = this.createEmptyTask();
      this.task.createdById = this.currentUserId;
      return;
    }
    this.isExistingClient = true;
    this.clientService
      .getClient(this.selectedClientId)
      .subscribe((client: any) => {
        this.task.clientId = client.clientId;
        this.task.clientName = client.clientName;
        this.task.phoneNumber = client.phoneNumber;
        this.task.email = client.email;
        this.task.clientCategoryId = client.clientCategoryId;
        this.cdr.markForCheck();
      });
  }
  loadClientTypes() {
    this.taskService.GetClientCategories().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);
        this.clientTypes = data.map((item: any) => ({
          id: Number(item.id),
          name: item.name
        }));
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  onClientTypeChange() {

    if (this.task.clientCategoryId === 1) {
      // New Client
      this.isExistingClient = false;
      this.selectedClientId = 0;
      this.task.clientName = '';
      this.task.phoneNumber = '';
      this.task.email = '';
    }
    else if (this.task.clientCategoryId === 2) {
      // Existing Client
      this.isExistingClient = true;

    }
  }
}
