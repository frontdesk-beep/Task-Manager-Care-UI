import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClientService } from '../../services/client.service';
import { ToastrService } from 'ngx-toastr';
import { Export } from '../../services/export';
import { ChangeDetectorRef } from '@angular/core';
import { UserStore } from '../../services/user-store';
import { HostListener } from '@angular/core';


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

  // filteredClients: any[] = [];
  // paginatedClients: any[] = [];
  categoryMap: { [key: number]: string } = {};
  loading: boolean = true;
  totalRecords = 0;

  constructor(
    private clientService: ClientService,
    private toastr: ToastrService,
    private exportService: Export,
    private userStore: UserStore,
    private ChangeDetectorRef: ChangeDetectorRef
  ) { }
@HostListener('document:click', ['$event'])
onScreenClick(event: MouseEvent) {
  console.log('SCREEN CLICKED', event.target);
}
  ngOnInit() {
    this.loadClientCategories();
    this.loadClients();
    
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadClients() {
    
    const query = {
    Search: this.searchClientName,
    CategoryId: this.filterCategoryId,
    CreatedDate: this.selectedDate,
    SortBy: this.sortKey,
    SortOrder: this.sortDir,
    Page: this.currentPage,
    PageSize: this.itemsPerPage
    }
    this.clientService.getClients(query).subscribe({
        next: (res: any) => {
          this.clients = res.data;
          this.totalRecords = res.totalRecords;
          this.loadClientCategories();
          this.loading = false;
          // this.ChangeDetectorRef.detectChanges();
        },
        error: (err: any) => {
          console.error('GetClients error:', err);
          this.clients = [];
          this.loading = false;
        }
      })
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

    if (this.sortKey === key)
        this.sortDir =
            this.sortDir === 'asc'
            ? 'desc'
            : 'asc';
    else{
        this.sortKey = key;
        this.sortDir = 'asc';
    }

    this.currentPage = 1;

    this.loadClients();
}
  getSortIcon(key: string): string {
    if (this.sortKey !== key) return '⇅';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }

  

  getTotalPages() {
      return Math.ceil(
        this.totalRecords /
        this.itemsPerPage
      );
  }

  goToPage(page: number) {
      this.currentPage = page;
      this.loadClients();
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
          const updatedClient = { ...this.selectedClient };

          const index = this.clients.findIndex(
            x => x.clientId === updatedClient.clientId
          );

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
            this.clients =
              this.clients.filter(
                x =>
                  x.clientId !==
                  this.selectedClient.clientId
              );
            this.loadClients();
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
    this.currentPage = 1;
    this.searchClientName = '';
    this.filterCategoryId = null;
    this.currentPage = 1;
    this.selectedDate = '';
    this.loadClients();
  }

  exportAssignedExcel() {
    this.exportService.exportExcel(this.clients, 'Completed_Assigned_Tasks_Export');
  }

  exportCreatedExcel() {
    this.exportService.exportExcel(this.clients, 'Completed_Created_Tasks_Export');
  }
  exportCreatedPdf() {
    this.exportService.exportPdf(
      this.clients,
      'Clients_Export'
    );

  }
}

