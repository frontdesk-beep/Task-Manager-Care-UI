import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClientService } from '../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { Export } from '../../services/export';
import { ChangeDetectorRef } from '@angular/core';
import { forkJoin } from 'rxjs';


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
  SearchClientName: string = '';
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

  filteredClients: any[] = [];
  paginatedClients: any[] = [];
  categoryMap: { [key: number]: string } = {};
  loading: boolean = true;

  constructor(
    private clientService: ClientService,
    private toastr: ToastrService,
    private exportService: Export,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadClients();
    // this.loadClientCategories();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadClients() {
    this.subs.add(
      this.clientService.getClients().subscribe({
        next: (res: any) => {
          res = res.clientcategories
            ? res.clientcategories
            : res;
          this.clients =
            Array.isArray(res)
              ? res
              : (res?.data || []);
              this.loadClientCategories();
          this.buildCategories();
          this.refreshGrid();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('GetClients error:', err);
          this.clients = [];
          this.loading = false;
        }
      })
    );
  }
  loadClientCategories() {
    this.subs.add(
      this.clientService.getClientCategories().subscribe({
        next: (res: any) => {
          this.clientCategories =
           Array.isArray(res)
            ? res
            : (res?.data || []);

            this.categoryMap = {};
            this.clientCategories.forEach((c: any) => {
              this.categoryMap[c.id] = c.clientType || c.name || '';
            });
          this.buildCategories();
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('GetClientCategories error:', err);
          this.clientCategories = [];
        }
      })
    );
  }

  refreshGrid() {
    let filtered = [...this.clients];

    if (this.filterCategoryId) {
      filtered = filtered.filter(
        x => x.clientCategoryId == this.filterCategoryId
      );
    }
    // Name
    if (this.searchClientName.trim()) {

      const search =
        this.searchClientName.toLowerCase();

      filtered = filtered.filter(
        x =>
          (x.clientName || '')
            .toLowerCase()
            .includes(search)
      );
    }

    // Date
    if (this.selectedDate) {

      filtered = filtered.filter(x => {

        const date =
          new Date(x.createdOn)
            .toISOString()
            .split('T')[0];

        return date === this.selectedDate;
      });
    }

    this.filteredClients = this.sortClients(filtered);

    const start =
      (this.currentPage - 1) * this.itemsPerPage;

    this.paginatedClients =
      this.filteredClients.slice(
        start,
        start + this.itemsPerPage
      );
  }
  trackByClientId(
    index: number,
    client: any
  ) {
    return client.clientId;
  }
  buildCategories() {
    const unique = new Map<number, string>();
    this.clients.forEach((c: any) => {
      const id = Number(c.clientCategoryId);
      if (id && !unique.has(id)) {
        unique.set(
          id,
          this.getCategoryName(id)
        );
      }
    });
    this.uniqueCategories =
      Array.from(unique,
        ([id, name]) => ({
          id,
          name
        }));
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
    this.currentPage = 1;
    this.refreshGrid();
  }

  getSortIcon(key: string): string {
    if (this.sortKey !== key) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  sortClients(items: any[]): any[] {
    if (!this.sortKey) return items;

    const sorted = [...items].sort((a, b) => {
      let aVal = a[this.sortKey];
      let bVal = b[this.sortKey];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return this.sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  getFilteredAndSortedClients(): any[] {
    let filtered = this.clients;

    // Filter by category
    if (this.filterCategoryId !== null &&
      this.filterCategoryId !== undefined) {
      filtered = filtered.filter(
        (c: any) =>
          Number(c.clientCategoryId) ===
          Number(this.filterCategoryId)
      );
    }

    // Filter by client name
    if (this.searchClientName.trim()) {
      const search =
        this.searchClientName
          .trim()
          .toLowerCase();
      filtered = filtered.filter((c: any) =>
        (c.clientName || '')
          .toLowerCase()
          .includes(search)
      );
    }
    // Created Date Filter
    if (this.selectedDate) {

      filtered = filtered.filter(
        (c: any) => {

          const clientDate =
            new Date(c.createdOn)
              .toISOString()
              .split('T')[0];
          return clientDate === this.selectedDate;

        });
    }
    return this.sortClients(filtered);

  }

  getPaginatedClients(): any[] {
    const filtered = this.getFilteredAndSortedClients();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.getFilteredAndSortedClients().length / this.itemsPerPage);
  }

  goToPage(page: number) {
    const total = this.getTotalPages();
    if (page >= 1 && page <= total) {
      this.currentPage = page;
      this.refreshGrid();
    }
  }
  //when edit button is clicked
  editClient(clientId: number) {
    const client = this.clients.find(
      (c: any) => c.clientId === clientId
    );
    if (client) {
      //Otherwise Angular is editing the actual row before Save is clicked.
      // this.selectedClient = client;
      this.selectedClient = { ...client };
      this.isEditMode = true;
    }
    else {
      alert('Client not found');
    }
  }
  updateClient(clientId: number) {
    if (!this.selectedClient) return;

    this.clientService
      .updateClient(
        this.selectedClient.clientId,
        this.selectedClient
      ).subscribe({
        next: () => {
          this.toastr.success(
            'Client updated successfully'
          );
          const index =
            this.clients.findIndex(
              x => x.clientId ==
                this.selectedClient.clientId
            );

          this.clients[index] =
          {
            ...this.selectedClient
          };

          this.refreshGrid();        //once the client is updated it will close the pop-up and reset the selected client and edit mode
          this.selectedClient = null;
          this.isEditMode = false;
        },
        error: (err: any) => {
          console.error('UpdateClient error:', err);
          this.toastr.error('Failed to update client');
        }
      });
  }

  //delete pop-up will open when delete button is clicked - both
  openDeletePopup(clientId: number) {
    const client = this.clients.find(
      (c: any) => c.clientId === clientId
    );
    if (client) {
      this.selectedClient = client;
      this.isDeleteMode = true;
    }
    else {
      alert('Client not found');
    }
  }
  deleteClient() {
    if (!this.selectedClient) return;
    this.subs.add(
      this.clientService.
        deleteClient(this.selectedClient.clientId)
        .subscribe({
          next: () => {
            const index =
              this.clients.filter(
                x => x.clientId !==
                  this.selectedClient.clientId
              );
           
            this.refreshGrid();
            this.selectedClient = null;
            this.isDeleteMode = false;
            this.toastr.success(
              'Client deleted successfully'
            );
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
    this.currentPage = 1;
    this.selectedDate = '';
    this.refreshGrid();
  }

  exportAssignedExcel() {
    const tasks = this.getFilteredAndSortedClients();
    this.exportService.exportExcel(tasks, 'Completed_Assigned_Tasks_Export');
  }

  exportCreatedExcel() {
    const tasks = this.getFilteredAndSortedClients();
    this.exportService.exportExcel(tasks, 'Completed_Created_Tasks_Export');
  }
  exportCreatedPdf() {

    const clients =
      this.getFilteredAndSortedClients();

    this.exportService.exportPdf(
      clients,
      'Clients_Export'
    );

  }
}

