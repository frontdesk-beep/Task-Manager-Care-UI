import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskReportService {
  private api = `${environment.apiUrl}/TaskReports`;

  constructor(private http: HttpClient) { }

  getCompletedTasks(
    year?: number | null,
    month?: number | null,
    clientName?: string,
    page: number = 1,
    pageSize: number = 10
  ) {

    let params = new HttpParams();

    if (year) {
      params = params.set('year', year);
    }

    if (month) {
      params = params.set('month', month);
    }

    if (clientName) {
      params = params.set('clientName', clientName);
    }

    params = params
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<any>(
      `${this.api}/completed`,
      { params }
    );
  }

  getYears() {
    return this.http.get<number[]>(
      `${this.api}/completed/years`
    );
  }
}