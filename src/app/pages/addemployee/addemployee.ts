import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { Export } from '../../services/export';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core'
import { BrowserStorageService } from '../../services/browser-storage.service';

interface Employee {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: string;
  isActive: boolean;
}
// for edit employee which does not send the pwd and date fields
interface EditEmployee {
  id: number;
  name: string;
  email: string;
  role: string;
}
@Component({
  selector: 'app-addemployee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './addemployee.html',
  styleUrl: './addemployee.css',
})
export class Addemployee implements OnInit, AfterViewInit {

  ngAfterViewInit() {
  }
  @ViewChild('taskForm') taskForm!: NgForm;

  employee: Employee = this.createEmptyEmployee();

  employees: Employee[] = [];

  searchText = '';
  roleFilter = '';
  // for inactive and deactive users
  statusFilter = 'Active';

  sortField: keyof Employee = 'id';
  sortDirection = 1;

  currentPage = 1;
  readonly pageSize = 5;

  employeeToDelete: Employee | null = null;
  // edit employee interfeace
  employeeToEdit: EditEmployee | null = null;
  currentUserId = 0;

  // instead of getters methods create arrays which store results to avoid repetation of execution
  filteredEmployees: Employee[] = [];
  displayedEmployees: Employee[] = [];
  paginatedEmployees: Employee[] = [];
  totalPages = 1;
  activeFilter = '';
  showInactive = false;
  currentUserRole = '';

  //will not accept futur dates;
  // add near your other properties
  maxDate: string = new Date().toISOString().split('T')[0];


  constructor(
    private auth: Auth,
    private toastr: ToastrService,
    private exportService: Export,
    private cdr: ChangeDetectorRef,
    private storage: BrowserStorageService

  ) { }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadEmployees();
  }

  createEmptyEmployee(): Employee {
    return {
      id: 0,
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    };
  }

  private loadCurrentUser() {
    try {
      this.currentUserRole = this.storage.getItem('role') || '';
      const user = JSON.parse(this.storage.getItem('user') || '{}');
      this.currentUserId = Number(user?.id || 0);
    } catch {
      this.currentUserId = 0;
    }
  }
  private extractArray(response: any): any[] {
    return Array.isArray(response)
      ? response
      : (response?.data || []);
  }
  // load employees on the table
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
            : '',
          isActive: employee.isActive
        }));
        this.updateEmployeeView();
        this.cdr.markForCheck();

      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastr.error('Error loading employees. Please try again.');
      }
    });
  }
  // create user and display updated array of users into table
  saveEmployee() {
    if (
      !this.employee.name ||
      !this.employee.email ||
      !this.employee.password ||
      !this.employee.role ||
      !this.employee.createdAt
    ) {
      this.toastr.warning('Please fill in all required fields before creating the employee')
      return;
    }
    if (this.employee.createdAt > this.maxDate) {
      this.toastr.warning('Joining date cannot be in the future');
      return;
    }
    const payload = {
      name: this.employee.name,
      email: this.employee.email,
      password: this.employee.password,
      role: this.employee.role,
      createdAt: this.employee.createdAt,
      isActive: true
    };
    this.auth.CreateUser(payload).subscribe({
      next: () => {
        this.toastr.success('Employee created successfully!');
        this.loadEmployees();
        this.clearForm();
      },
      error: (error) => {
        console.error('Full Error: ', error);

        const message = error?.error?.errors
          ? JSON.stringify(error.error.errors)
          : 'Error creating employee. Please try again.';
        this.toastr.error(message);
      }
    });
  }

  clearForm() {
    this.employee = this.createEmptyEmployee();

    this.taskForm?.resetForm({
      name: '',
      email: '',
      password: '',
      role: 'Employee',
      createdAt: new Date().toISOString().split('T')[0]
    });
    this.employeeToDelete = null;
  }

  // edit employee
  editEmployee(employee: Employee) {
    this.auth.getProfile(employee.id).subscribe({
      next: (user: any) => {
        this.employeeToEdit = {
          id: Number(user.id),
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'Employee',
        };
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading employee profile:', error);
        this.toastr.error('Unable to load employee');
      }
    });
  }

  updateEmployee() {
    if (!this.employeeToEdit) {
      return;
    }
    const payload = {
      name: this.employeeToEdit.name,
      email: this.employeeToEdit.email,
      role: this.employeeToEdit.role,
    };
    this.auth.UpdateUser(
      this.employeeToEdit.id, payload
    ).subscribe({
      next: () => {
        this.employeeToEdit = null
        this.loadEmployees();
        this.toastr.success('Employee updated successfully');
        //close popup
      },
      error: (error) => {
        this.toastr.error("failed to update employee");
      }
    })
  }
  cancelEdit() {
    this.employeeToEdit = null
  }
  // closing popup of DELETE
  confirmDelete(employee: Employee) {
    this.employeeToDelete = employee;
  }

  // prevent logged-in user from deleting themselves
  canDeleteEmployee(employee: Employee): boolean {

    // cannot deactivate yourself
    if (employee.id === this.currentUserId) {
      return false;
    }

    // SuperAdmin can deactivate everyone
    if (this.currentUserRole === 'SuperAdmin') {
      return true;
    }

    // Admin can only deactivate Employees
    if (this.currentUserRole === 'Admin') {
      return employee.role === 'Employee';
    }

    return false;
  }
  cancelDelete() {
    this.employeeToDelete = null;
  }

  deleteEmployee() {
    if (!this.employeeToDelete) {
      return;
    }

    this.auth.DeleteUser(this.employeeToDelete.id).subscribe({
      next: () => {
        this.cancelDelete();
        this.loadEmployees();
        this.toastr.success('Employee deactivated successfully!');

      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.toastr.error('Oops!! seems like the tasks needs to be reassigned before deleting this employee');
      }
    });
  }

  // Sorting
  sortBy(field: keyof Employee) {
    if (this.sortField === field) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortField = field;
      this.sortDirection = 1;
    }

    this.updateEmployeeView();
  }

  sortClass(field: string) {
    if (this.sortField !== field) {
      return '';
    }

    return this.sortDirection === 1 ? 'asc' : 'desc';
  }

  // Filtering
  onFilterChange() {
    this.currentPage = 1;
    this.updateEmployeeView();
  }

  clearFilters() {
    this.searchText = '';
    this.roleFilter = '';
    this.statusFilter = 'Active';
    this.currentPage = 1;
    this.updateEmployeeView();
  }

  // Main method for filtering, sorting and pagination
  updateEmployeeView() {
    const filter = this.searchText.trim().toLowerCase();

    this.filteredEmployees = this.employees.filter(employee => {

      const text =
        `${employee.name} ${employee.email} ${employee.role}`.toLowerCase();

      const matchesSearch =
        !filter || text.includes(filter);

      const matchesRole =
        !this.roleFilter ||
        employee.role === this.roleFilter;

      const matchesStatus =
        this.statusFilter === 'All'
          ? true
          : this.statusFilter === 'Active'
            ? employee.isActive
            : !employee.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.displayedEmployees = [...this.filteredEmployees].sort((a, b) => {

      const aValue = a[this.sortField];
      const bValue = b[this.sortField];

      if (
        typeof aValue === 'number' &&
        typeof bValue === 'number'
      ) {
        return (aValue - bValue) * this.sortDirection;
      }

      return String(aValue)
        .localeCompare(String(bValue))
        * this.sortDirection;
    });

    this.totalPages = Math.max(
      1,
      Math.ceil(this.filteredEmployees.length / this.pageSize)
    );

    const start =
      (this.currentPage - 1) * this.pageSize;

    this.paginatedEmployees =
      this.displayedEmployees.slice(
        start,
        start + this.pageSize
      );
  }

  // Pagination
  goToPage(page: number) {
    this.currentPage = page;
    this.updateEmployeeView();
  }
  trackByEmployeeId(index: number, employee: Employee) {
    return employee.id;
  }

  // export buttons
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

  reactivateEmployee(employee: Employee) {
    this.auth.ReactivateUser(employee.id)
      .subscribe({
        next: () => {
          this.toastr.success('Employee reactivated successfully');
          this.loadEmployees();
        },
        error: () => {
          this.toastr.error('unable to reactivate employee');
        }
      })
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
}
