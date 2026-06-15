import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root',
})
export class Export {
  exportExcel(
    data: any[],
    fileName:string
  )
  {
    if (!Array.isArray(data)) data = [];
    const worksheet = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
    const workbook = XLSX.utils.book_new();

    // use the provided fileName as the sheet name when possible
    const sheetName = String(fileName || 'Sheet1').slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  }
  exportPdf(
    data: any[],
    title: string
  )
  {
    const doc = new jsPDF();
    const safeTitle = String(title || 'Export');
    doc.text(safeTitle, 15, 10);

    const headers = (Array.isArray(data) && data.length) ? Object.keys(data[0]) : [];
    const body = (Array.isArray(data) && data.length)
      ? data.map((x: any) => headers.map(h => x[h]))
      : [];

    autoTable(doc, {
      head: headers.length ? [headers] : [],
      body: body
    });

    doc.save(`${safeTitle}.pdf`);
  }
}
