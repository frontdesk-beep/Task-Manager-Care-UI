import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private api =  `${environment.apiUrl}/client`;
  private categoryApi = `${environment.apiUrl}/clientcategories`;

  constructor(private http: HttpClient) { }

  //params is for filters to work out - now angular can send the, api request back to backend for serach with the values in path:
  //ex: /api/client?Search=John&CategoryId=2&Page=1&PageSize=5
  getClients(query: any) {
    let params = new HttpParams();

    if (query.Search)
      params = params.set('Search', query.Search);

    if (query.CategoryId != null)
      params = params.set('CategoryId', query.CategoryId);

    if (query.CreatedDate)
      params = params.set('CreatedDate', query.CreatedDate);

    if (query.SortBy)
      params = params.set('SortBy', query.SortBy);

    if (query.SortOrder)
      params = params.set('SortOrder', query.SortOrder);

    params = params.set('Page', query.Page);
    params = params.set('PageSize', query.PageSize);

    return this.http.get(this.api, { params });
  }

  getClient(id: number) {
    return this.http.get(`${this.api}/${id}`);
  }

  //create client and edit client are using the same endpoint, so we can use the same function for both create and edit
  createClient(data: any) {
    return this.http.post(this.api, data);
  }
  editClient(data: any) {
    return this.http.put(`${this.api}/${data.id}`, data);
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
  // reusing the getclients endpoint for create task-> filtered clients
  searchClients(search: string = '', pagesize:number = 5) {
    const params:any = {
      categoryId: 2,
      pageSize: pagesize.toString(),
      page: '1'
    };
    if(search){
      params.search= search;
    }
  return this.http.get(`${this.api}`, { params });
}
}