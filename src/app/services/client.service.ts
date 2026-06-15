import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  api = 'https://localhost:7148/api/client';
  categoryApi = 'https://localhost:7148/api/clientcategories';

  constructor(private http: HttpClient) {}

  getClients() {
    return this.http.get(this.api);
  }

  getClient(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }

  editClient(data: any) {
    return this.http.post(this.api, data);
  }

  updateClient(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  deleteClient(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

  getClientCategories() {
    return this.http.get(this.categoryApi);
  }
}