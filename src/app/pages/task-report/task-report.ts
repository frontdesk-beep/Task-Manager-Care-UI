import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TaskReportService } from '../../services/task-report';
import { ChangeDetectorRef } from '@angular/core';
import { Export } from '../../services/export';

@Component({
  selector: 'app-task-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-report.html',
  styleUrl: './task-report.css'
})
export class TaskReportComponent implements OnInit {

  reports: any[] = [];
  years: number[] = [];

  selectedYear: number | null = null;
  selectedMonth: number | null = null;
  clientName = '';

  page = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  reportGenerated = false;

  months = [
    { id: 1, name: 'January' },
    { id: 2, name: 'February' },
    { id: 3, name: 'March' },
    { id: 4, name: 'April' },
    { id: 5, name: 'May' },
    { id: 6, name: 'June' },
    { id: 7, name: 'July' },
    { id: 8, name: 'August' },
    { id: 9, name: 'September' },
    { id: 10, name: 'October' },
    { id: 11, name: 'November' },
    { id: 12, name: 'December' }
  ];

  constructor(private reportService: TaskReportService,
    private ChangeDetectorRef: ChangeDetectorRef,
    private exportService: Export,
  ) { }

  ngOnInit(): void {
    this.loadYears();
  }

  loadYears() {
    this.reportService.getYears().subscribe({
      next: res => this.years = res,
      error: err => console.log(err)
    });
  }

  generateReport() {
    this.page = 1;
    this.loadReports();
    this.reportGenerated = true;
  }

  loadReports() {

    this.reportService.getCompletedTasks(
      this.selectedYear,
      this.selectedMonth,
      this.clientName,
      this.page,
      this.pageSize
    ).subscribe({

      next: (res) => {

        this.reports = res.items;
        this.totalCount = res.totalCount;
        this.totalPages = Math.ceil(res.totalCount / this.pageSize);
        this.ChangeDetectorRef.detectChanges();

      },

      error: err => console.log(err)

    });

  }

  clearFilters() {

    this.selectedYear = null;
    this.selectedMonth = null;
    this.clientName = '';

    this.page = 1;

    this.reportGenerated = false;
    this.reports = [];

  }

  previousPage() {

    if (this.page > 1) {

      this.page--;

      this.loadReports();

    }

  }

  nextPage() {

    if (this.page < this.totalPages) {

      this.page++;

      this.loadReports();

    }

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

exportTasksExcel() {
    this.exportService.exportExcel(this.reports, 'Report_Export');
  }
  exportTasksPdf() {
    this.exportService.exportPdf(
      this.reports,
      'Report_Export'
    );

  }
}