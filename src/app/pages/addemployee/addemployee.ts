import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { Export } from '../../services/export';
import { NgForm } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { email } from '@angular/forms/signals';
import { ChangeDetectorRef } from '@angular/core'

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
    console.log('form initialized');
  }
  @ViewChild('taskForm') taskForm!: NgForm;

  employee: Employee = this.createEmptyEmployee();

  employees: Employee[] = [];
  // editMode = false;

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


  constructor(
    private auth: Auth,
    private toastr: ToastrService,
    private exportService: Export
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
      this.currentUserRole = localStorage.getItem('role') || '';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
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
        console.log('GET USERS RESPONSE', response);
        const data = this.extractArray(response);
        console.log('USERS COUNT', data.length);

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
        console.log('loading employees..: ');
        this.loadEmployees();
        console.log('clear butn start...')
        this.clearForm();
        console.log("after clear: ");
      },
      error: (error) => {
        console.error('Full Error: ', error);
        console.log('Validation:', error.error);

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
    console.log("edit wmployee is clicked...", employee.id)
    this.auth.getProfile(employee.id).subscribe({
      next: (user: any) => {
        console.log('API RESPONSE');
        this.employeeToEdit = {
          id: Number(user.id),
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'Employee',
        };
        console.log('employeeToEdit:', this.employeeToEdit);
      },
      error: (error) => {
        console.error('Error loading employee profile:', error);
        this.toastr.error('uable to load employee');
      }
    });
  }

  updateEmployee() {
    console.log('updating the data...')
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
        // this.toastr.success('Employee updated successfully');
        this.employeeToEdit = null
        this.loadEmployees();
        this.toastr.success('Employee updated successfully');
        console.log('going to close popup');
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
    console.log('closing popup');
    this.employeeToDelete = employee;
  }

  // prevent logged-in user from deleting themselves
  canDeleteEmployee(employee: Employee): boolean {
    return employee.id != this.currentUserId;
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
}
