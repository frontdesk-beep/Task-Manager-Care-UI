import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';
import {ToastrService} from 'ngx-toastr';

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
  task: TaskItem = this.createEmptyTask();

  clientCategories: DropdownItem[] = [];
  statuses: DropdownItem[] = [];
  priorities: DropdownItem[] = [];
  serviceCategories: DropdownItem[] = [];
  users: DropdownItem[] = [];

  currentUserId = 0;

  constructor(
    private taskService: TaskService,
    private auth: Auth,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadUsers();
    this.loadClientCategories();
    this.loadStatuses();
    this.loadPriorities();
    this.loadServiceCategories();
  }

  createEmptyTask(): TaskItem {
    const now = new Date();

    return {
      clientName: '',
      clientCategoryId: 1,
      phoneNumber: '',
      email: '',
      assignedToId: 0,
      createdOn: now.toISOString().slice(0, 16),
      statusId: 1,
      task_Description: '',
      priorityId: 2,
      dueDate: now.toISOString().slice(0, 10),
      createdById: 0,
      serviceCategoryId: 1
    };
  }

  private loadCurrentUser() {
    const userData = localStorage.getItem('user');

    if (!userData) {
      return;
    }

    try {
      const user = JSON.parse(userData);

      this.currentUserId = Number(user?.id || 0);
      this.task.createdById = this.currentUserId;
    } catch {
      this.currentUserId = 0;
      this.task.createdById = 0;
    }
  }

  private extractArray(response: any): any[] {
    return Array.isArray(response)
      ? response
      : (response?.data || []);
  }

  loadClientCategories() {
    this.taskService.GetClientCategories().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.clientCategories = data.map((item: any) => ({
          id: Number(item.id),
          name: item.name || item.categoryName || item.type || ''
        }));

        this.cdr.detectChanges();
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

        this.cdr.detectChanges();
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

        this.cdr.detectChanges();
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

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading service categories:', error);
      }
    });
  }

  loadUsers() {
    this.auth.GetUsers().subscribe({
      next: (response: any) => {
        const users = this.extractArray(response);

        this.users = users.map((user: any) => ({
          id: Number(user.id),
          name: user.name || user.email || `User ${user.id}`
        }));

        this.cdr.detectChanges();
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
      next: (response: any) => {
        this.toastr.success('Task created successfully!');
        this.resetTask();
        this.cdr.detectChanges();
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
    this.task = this.createEmptyTask();
    this.task.createdById = this.currentUserId;
    this.cdr.detectChanges();
  }
}
