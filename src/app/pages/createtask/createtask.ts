import {
  Component,
  OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { TaskService } from '../../services/task.service';
// import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import { UserStore } from '../../services/user-store';

interface DropdownItem {
  id: number;
  name: string;
}

interface TaskItem {
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
  imports: [CommonModule, FormsModule],
  templateUrl: './createtask.html',
  styleUrl: './createtask.css',
})
export class Createtask implements OnInit {

  @ViewChild('taskForm')taskForm!: NgForm;

  task: TaskItem = this.createEmptyTask();

  clientCategories: DropdownItem[] = [];
  statuses: DropdownItem[] = [];
  priorities: DropdownItem[] = [];
  serviceCategories: DropdownItem[] = [];
  users: DropdownItem[] = [];
  clientCategoryId=0;

  currentUserId = 0;
  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private toastr: ToastrService,
    private userStore: UserStore
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadClientCategories();
    this.loadStatuses();
    this.loadPriorities();
    this.loadServiceCategories();
    
  }
// craete a brand new empty task object-instead of writing this.task ={clientname:'',phonenumber:''}
// instead of writing evry field empty again and again create one seperate object which you can call.
  createEmptyTask(): TaskItem {
    const now = new Date();

    return {
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
      if(!user) return;
      this.currentUserId=user.id;
      this.task.createdById=user.id;
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

  loadClientCategories() {
    this.taskService.GetClientCategories().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.clientCategories = data.map((item: any) => ({
          id: Number(item.id),
          name: item.name || item.categoryName || item.type || ''
        }));

      },
      error: (error) => {
        console.error('Error loading client categories:', error);
        this.toastr.error('Error loading client categories. Please try again.');
      }
    });
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
        },0);
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
    // this.cdr.detectChanges();
  }
}
