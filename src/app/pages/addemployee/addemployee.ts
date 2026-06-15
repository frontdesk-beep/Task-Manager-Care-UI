import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import {ToastrService} from 'ngx-toastr';
import { Export } from '../../services/export';

interface Employee {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
}

@Component({
  selector: 'app-addemployee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addemployee.html',
  styleUrl: './addemployee.css',
})
export class Addemployee implements OnInit {
  employee: Employee = this.createEmptyEmployee();

  employees: Employee[] = [];
  editMode = false;

  searchText = '';
  roleFilter = '';

  sortField: keyof Employee = 'id';
  sortDirection = 1;

  currentPage = 1;
  readonly pageSize = 5;

  employeeToDelete: Employee | null = null;
  currentUserId = 0;

  constructor(
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private exportService: Export
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadEmployees();
  }

  private loadCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUserId = Number(user?.id || 0);
    } catch {
      this.currentUserId = 0;
    }
  }

  createEmptyEmployee(): Employee {
    return {
      id: 0,
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      createdAt: new Date().toISOString().split('T')[0]
    };
  }

  private extractArray(response: any): any[] {
    return Array.isArray(response)
      ? response
      : (response?.data || []);
  }

  loadEmployees() {
    this.auth.GetUsers().subscribe({
      next: (response: any) => {
        const data = this.extractArray(response);

        this.employees = data.map((employee: any) => ({
          id: Number(employee.id),
          name: employee.name || '',
          email: employee.email || '',
          password: '',
          role: employee.role || 'Employee',
          createdAt: employee.createdAt
            ? employee.createdAt.split('T')[0]
            : ''
        }));

        console.log('Employees count:', this.employees.length);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastr.error('Error loading employees. Please try again.');
      }
    });
  }

  saveEmployee() {
    const payload = {
      name: this.employee.name,
      email: this.employee.email,
      password: this.employee.password,
      role: this.employee.role,
      createdAt: this.employee.createdAt
    };

    const request = this.editMode
      ? this.auth.UpdateUser(this.employee.id, payload)
      : this.auth.CreateUser(payload);

    request.subscribe({
      next: (response: any) => {
        this.toastr.success(
          this.editMode
            ? 'Employee updated successfully!'
            : 'Employee created successfully!'
        );

        this.loadEmployees();
        this.clearForm();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error saving employee:', error);
        this.toastr.error('Error saving employee. Please try again.');
      }
    });
  }

  clearForm() {
    this.employee = this.createEmptyEmployee();
    this.editMode = false;
    this.employeeToDelete = null;
    this.cdr.detectChanges();
  }

  sortBy(field: keyof Employee) {
    if (this.sortField === field) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortField = field;
      this.sortDirection = 1;
    }

    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  sortClass(field: string) {
    if (this.sortField !== field) {
      return '';
    }

    return this.sortDirection === 1 ? 'asc' : 'desc';
  }

  onFilterChange() {
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchText = '';
    this.roleFilter = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  get filteredEmployees() {
    const filter = this.searchText.trim().toLowerCase();

    return this.employees.filter(employee => {
      const text = `${employee.name} ${employee.email} ${employee.role}`
        .toLowerCase();

      const matchesSearch =
        !filter ||
        text.includes(filter);

      const matchesRole =
        !this.roleFilter ||
        employee.role === this.roleFilter;

      return matchesSearch && matchesRole;
    });
  }

  get displayedEmployees() {
    return [...this.filteredEmployees].sort((a, b) => {
      const aValue = a[this.sortField];
      const bValue = b[this.sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * this.sortDirection;
      }

      const aText = String(aValue || '').toLowerCase();
      const bText = String(bValue || '').toLowerCase();

      if (aText < bText) {
        return -1 * this.sortDirection;
      }

      if (aText > bText) {
        return 1 * this.sortDirection;
      }

      return 0;
    });
  }

  get paginatedEmployees() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.displayedEmployees.slice(start, start + this.pageSize);
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.filteredEmployees.length / this.pageSize));
  }

  goToPage(page: number) {
    this.currentPage = Math.max(1, Math.min(page, this.totalPages));
    this.cdr.detectChanges();
  }

  confirmDelete(emp: Employee) {
    this.employeeToDelete = emp;
    this.cdr.detectChanges();
  }

  canDeleteEmployee(employee: Employee): boolean {
    return employee.id !== this.currentUserId;
  }

  editEmployee(employee: Employee) {
    this.auth.getProfile(employee.id).subscribe({
      next: (user: any) => {
        this.employee = {
          id: Number(user.id),
          name: user.name || '',
          email: user.email || '',
          password: '',
          role: user.role || 'Employee',
          createdAt: user.createdAt
            ? user.createdAt.split('T')[0]
            : ''
        };

        this.editMode = true;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading employee profile:', error);
      }
    });
  }

  cancelEdit() {
    this.clearForm();
  }

  cancelDelete() {
    this.employeeToDelete = null;
    this.cdr.detectChanges();
  }

  deleteEmployee() {
    if (!this.employeeToDelete) {
      return;
    }

    this.auth.DeleteUser(this.employeeToDelete.id).subscribe({
      next: () => {
        this.toastr.success('Employee deleted successfully!');
        this.loadEmployees();
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.toastr.error('Oops!! seems like the tasks needs to be reassigned before deleting this employee');
      }
    });
  }

  trackByEmployeeId(index: number, employee: Employee) {
    return employee.id;
  }

  exportEmployeesExcel() {
    this.exportService.exportExcel(
      this.filteredEmployees,
      'Employees'
    );
  }
  exportEmployeesPdf() {
    this.exportService.exportPdf(
      this.filteredEmployees,
      'Employees'
    );
  }

}
