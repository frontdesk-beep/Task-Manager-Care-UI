import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-remarks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remarks.html',
  styleUrl: './remarks.css'
})
export class Remarks implements OnChanges {

  @Input() taskId!: number;

  remarks: any[] = [];
  newRemark = '';

  constructor(private taskService: TaskService,
    private cdr: ChangeDetectorRef

  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskId'] && this.taskId) {
      this.loadRemarks();
    }
  }

  loadRemarks() {
    this.taskService.GetComments(this.taskId).subscribe({
      next: (res: any) => {
        this.remarks = res?.data ?? res;
        this.cdr.markForCheck();
      }
    });
  }

  addRemark() {
    if (!this.newRemark.trim()) return;

    this.taskService.AddComment(this.taskId, {
      text: this.newRemark
    }).subscribe({
      next: () => {
        this.newRemark = '';
        this.loadRemarks();
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}