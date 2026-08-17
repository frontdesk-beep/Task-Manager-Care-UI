import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClientService } from '../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { Export, ExportColumn } from '../../services/export';
import { ChangeDetectorRef } from '@angular/core';
import { UserStore } from '../../services/user-store';

@Component({
  selector: 'app-clientlist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientlist.html',
  styleUrl: './clientlist.css',
})
export class Clientlist implements OnInit, OnDestroy {
  clients: any[] = [];
  clientCategories: any[] = [];
  //for pop-up
  selectedClient: any = null;
  //for pop-up
  isEditMode: boolean = false;
  isDeleteMode: boolean = false;
  filterCategoryId: number | null = null;
  selectedDate: string = '';
  // Sorting
  sortKey: string = '';
  sortDir: 'asc' | 'desc' = 'asc';

  // Filtering
  searchClientName: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  private subs = new Subscription();
  uniqueCategories: any[] = [];

  categoryMap: { [key: number]: string } = {};
  //for showing skeleton
  loading: boolean = true;
  totalRecords = 0;

  //Client creation
  isCreatedMode = false;
  formSubmitted = false;
  //new client manually added
  newClient: any = {
    clientName: '',
    companyName: '',
    phoneNumber: '',
    email: '',
    address: '',
    clientCategoryId: null,
  };


  // Column map used for both PDF and Excel exports
  private readonly exportColumns: ExportColumn[] = [
    { key: 'clientName', label: 'Client' },
    { key: 'categoryName', label: 'Category' },
    { key: 'companyName', label: 'Company' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    { key: 'createdOnFormatted', label: 'Created On' },
  ];

  constructor(
    private clientService: ClientService,
    private toastr: ToastrService,
    private exportService: Export,
    private userStore: UserStore,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadClientCategories();
    this.loadClients();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadClients(page: number = this.currentPage) {
    //SKELOTON
    this.loading = true;
    this.cdr.markForCheck();

    const query = {
      Search: this.searchClientName,
      CategoryId: this.filterCategoryId,
      CreatedDate: this.selectedDate,
      SortBy: this.sortKey,
      SortOrder: this.sortDir,
      Page: page,
      PageSize: this.itemsPerPage
    };
    this.clientService.getClients(query).subscribe({
      next: (res: any) => {
        this.clients = res.data;
        this.totalRecords = res.totalRecords;
        this.currentPage = page;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('GetClients error:', err);
        this.clients = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadClientCategories() {
    this.subs.add(
      this.clientService.getClientCategories().subscribe({
        next: (res: any) => {
          this.clientCategories = Array.isArray(res) ? res : (res?.data || []);

          this.categoryMap = {};
          this.clientCategories.forEach((c: any) => {
            this.categoryMap[c.id] = c.clientType || c.name || '';
          });
          this.buildCategories();
        },
        error: (err: any) => {
          console.error('GetClientCategories error:', err);
          this.clientCategories = [];
        }
      })
    );
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  trackByClientId(index: number, client: any) {
    return client.clientId;
  }

  buildCategories() {
    const unique = new Map<number, string>();
    this.clients.forEach((c: any) => {
      const id = Number(c.clientCategoryId);
      if (id && !unique.has(id)) {
        unique.set(id, this.getCategoryName(id));
      }
    });
    this.uniqueCategories = Array.from(unique, ([id, name]) => ({ id, name }));
  }

  getCategoryName(id: any): string {
    const cat = this.clientCategories.find((c: any) => Number(c.id) === Number(id));
    return cat ? (cat.clientType || cat.name || '') : '';
  }

  toggleSort(key: string) {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.loadClients(1);
  }

  getSortIcon(key: string): string {
    if (this.sortKey !== key) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  getTotalPages() {
    return Math.max(1, Math.ceil(this.totalRecords / this.itemsPerPage));
  }

  goToPage(page: number) {
    if (page < 1 || page > this.getTotalPages()) return;
    this.loadClients(page);
  }

  //when edit button is clicked
  editClient(clientId: number) {
    const client = this.clients.find((c: any) => c.clientId === clientId);
    if (client) {
      this.selectedClient = { ...client };
      this.isEditMode = true;
    } else {
      alert('Client not found');
    }
  }

  updateClient(clientId: number) {
    if (!this.selectedClient) return;

    this.clientService.updateClient(this.selectedClient.clientId, this.selectedClient).subscribe({
      next: () => {
        const updatedClient = { ...this.selectedClient };
        const index = this.clients.findIndex(x => x.clientId === updatedClient.clientId);
        if (index !== -1) {
          this.clients[index] = updatedClient;
        }
        this.isEditMode = false;
        this.selectedClient = null;
        this.loadClients();
        this.toastr.success('Client updated successfully');
      },
      error: (err: any) => {
        console.error('UpdateClient error:', err);
        this.toastr.error('Failed to update client');
      }
    });
  }

  //delete pop-up will open when delete button is clicked - both
  openDeletePopup(clientId: number) {
    const client = this.clients.find((c: any) => c.clientId === clientId);
    if (client) {
      this.selectedClient = client;
      this.isDeleteMode = true;
    } else {
      alert('Client not found');
    }
  }

  deleteClient() {
    if (!this.selectedClient) return;
    this.subs.add(
      this.clientService.deleteClient(this.selectedClient.clientId).subscribe({
        next: () => {
          this.clients = this.clients.filter(x => x.clientId !== this.selectedClient.clientId);
          this.loadClients();
          this.selectedClient = null;
          this.isDeleteMode = false;
          this.toastr.success('Client deleted successfully');
        },
        error: (err: any) => {
          console.error('DeleteClient error:', err);
          this.toastr.error('Failed to delete client');
        }
      })
    );
  }

  //when cancel button is clicked in pop-up
  cancelEdit() {
    this.selectedClient = null;
    this.isEditMode = false;
  }

  cancelDelete() {
    this.selectedClient = null;
    this.isDeleteMode = false;
  }

  clearFilters() {
    this.searchClientName = '';
    this.filterCategoryId = null;
    this.selectedDate = '';
    this.loadClients(1);
  }

  // Fetches ALL records matching current filters (not just the current page),
  // and formats them for export (category name instead of ID, readable date).
  private fetchAllForExport(cb: (rows: any[]) => void) {
    const query = {
      Search: this.searchClientName,
      CategoryId: this.filterCategoryId,
      CreatedDate: this.selectedDate,
      SortBy: this.sortKey,
      SortOrder: this.sortDir,
      Page: 1,
      PageSize: 100000
    };
    this.clientService.getClients(query).subscribe({
      next: (res: any) => {
        const rows = (res.data || []).map((c: any) => ({
          ...c,
          categoryName: this.getCategoryName(c.clientCategoryId),
          createdOnFormatted: c.createdOn
            ? new Date(c.createdOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-'
        }));
        cb(rows);
      },
      error: (err: any) => {
        console.error('Export fetch error:', err);
        this.toastr.error('Failed to fetch data for export');
      }
    });
  }

  exportCreatedExcel() {
    this.fetchAllForExport(rows =>
      this.exportService.exportExcel(rows, 'Clients_Export', this.exportColumns)
    );
  }

  exportCreatedPdf() {
    this.fetchAllForExport(rows =>
      this.exportService.exportPdf(rows, 'Clients_Export', this.exportColumns)
    );
  }

  // For the "Create New Client" form
  openCreateClientForm() {
    this.newClient = {
      clientName: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      address: '',
      clientCategoryId: null,
    };
    this.formSubmitted = false;
    this.isCreatedMode = true;
  }

  cancelCreateClient() {
    this.isCreatedMode = false;
    this.formSubmitted = false;
    this.newClient = {
      clientName: '',
      companyName: '',
      phoneNumber: '',
      email: '',
      address: '',
      clientCategoryId: null,
    };
  }

  createClient(form: any) {
    this.formSubmitted = true;
    if (form.invalid) {
      this.toastr.error('Please fill in all required fields correctly.');
      return;
    }
    this.clientService.createClient(this.newClient).subscribe({
      next: (res: any) => {
        this.toastr.success('Client created successfully');
        this.isCreatedMode = false;
        this.formSubmitted = false;
        this.newClient = {
          clientName: '',
          companyName: '',
          phoneNumber: '',
          email: '',
          address: '',
          clientCategoryId: null,
        };
        this.loadClients();
      },
      error: (err: any) => {
        console.error('CreateClient error:', err);
        this.toastr.error('Failed to create client');
      }
    });
  }
}