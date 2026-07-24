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

  currentUserId = 0;
  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private toastr: ToastrService,
    private userStore: UserStore,
    private clientService: ClientService
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadClientTypes();
    this.loadStatuses();
    this.loadPriorities();
    this.loadServiceCategories();
    this.loadClients();
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
    this.auth.GetUsers().subscribe({
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
  loadClients() {
    this.clientService.getExistingClients().subscribe({
      next: (response: any) => {
        console.log("API Response:", response);
        this.clients = this.extractArray(response);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
    });
  }

  saveTask() {
    if (
      !this.task.clientName ||
      !this.task.email ||
      !this.task.phoneNumber ||
      !this.task.task_Description
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
        console.log("before reset: ");
        setTimeout(() => {
          this.resetTask();
        }, 0);
        console.log("After reset: ");
      },
      error: (error) => {
        console.error('Full Error:', error);
        console.log('Validation:', error.error);

        const message = error?.error?.errors
          ? JSON.stringify(error.error.errors)
          : 'Error creating task. Please try again.';

        this.toastr.error(message);
      }
    });
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
    // console.log('Before reset: ', this.task);
    // becoz of this the after clicking on the save btn it was pointing below method that's why the the clear was not woking perfectly so we craeteed seperate one for reset.
    // which we can use in the save task() also now.
    // this.task = this.createEmptyTask();
    // this.task.createdById = this.currentUserId;
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
      });
  }
  loadClientTypes() {
    this.taskService.GetClientCategories().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);
        this.clientTypes=data.map((item:any)=>({
          id:Number(item.id),
          name:item.name
        }));
      },
      error:(error)=>{
        console.error(error);
      }
    });
  }

  onClientTypeChange() {

     if (this.task.clientCategoryId === 1) {
        // New Client
        this.isExistingClient = false;
        this.selectedClientId = 0;
    }
    else if (this.task.clientCategoryId === 2) {
        // Existing Client
        this.isExistingClient = true;

  }
}}
