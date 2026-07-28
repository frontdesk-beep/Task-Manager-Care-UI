import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { ChangeDetectorRef } from '@angular/core'

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activity.html',
  styleUrl: './activity.css',
})
export class Activity implements OnChanges {

  @Input() taskId!: number;

  history: any[] = [];
  loading = false;

  constructor(private taskService: TaskService,
    private changedetectRef: ChangeDetectorRef
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskId'] && this.taskId) {
      this.loadHistory();
    }
  }

  loadHistory() {
    this.loading = true;
    this.taskService.GetHistory(this.taskId).subscribe({
      next: (res: any) => {
        this.history = res?.data ?? res;
        this.loading = false;
       this.changedetectRef.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  getIconClass(action: string): string {
    const a = (action || '').toLowerCase();
    if (a.includes('created')) return 'icon-created';
    if (a.includes('status')) return 'icon-status';
    if (a.includes('remark')) return 'icon-remark';
    return 'icon-default';
  }

  getIcon(action: string): string {
    const a = (action || '').toLowerCase();
    if (a.includes('created')) return '+';
    if (a.includes('status')) return '↻';
    if (a.includes('remark')) return '✎';
    return '•';
  }
}