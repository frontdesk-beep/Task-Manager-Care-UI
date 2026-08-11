import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn {
  key: string;
  label: string;
}

@Injectable({
  providedIn: 'root',
})
export class Export {

  // If columns are given, output only those fields with readable labels.
  // If not, just use whatever fields are on the data as-is (old behavior).
  private formatRows(data: any[], columns?: ExportColumn[]): any[] {
    if (!Array.isArray(data) || !data.length) return [{}];
    if (!columns?.length) return data;

    return data.map(row => {
      const out: any = {};
      columns.forEach(col => out[col.label] = row[col.key] ?? '-');
      return out;
    });
  }

  exportExcel(data: any[], fileName: string, columns?: ExportColumn[]) {
    const rows = this.formatRows(data, columns);

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, String(fileName || 'Sheet1').slice(0, 31));

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
  }

  exportPdf(data: any[], title: string, columns?: ExportColumn[]) {
    const rows = this.formatRows(data, columns);
    const headers = Object.keys(rows[0] || {});
    const body = rows.map(row => headers.map(h => row[h]));

    const doc = new jsPDF();
    doc.text(String(title || 'Export'), 14, 12);

    autoTable(doc, {
      startY: 18,
      head: headers.length ? [headers] : [],
      body,
      styles: { fontSize: 8 },
    });

    doc.save(`${title}.pdf`);
  }
}