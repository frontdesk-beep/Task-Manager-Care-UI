import { Component, Input } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details {
  @Input() task: any;

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase().replace(/\s+/g, '-');
    if (s.includes('progress')) return 'status-in-progress';
    if (s.includes('complete') || s.includes('done')) return 'status-completed';
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('assign')) return 'status-assigned';
    return 'status-default';
  }

  getPriorityClass(priority: string): string {
    const p = (priority || '').toLowerCase();
    if (p.includes('high') || p.includes('urgent')) return 'priority-high';
    if (p.includes('medium')) return 'priority-medium';
    if (p.includes('low')) return 'priority-low';
    return 'priority-default';
  }
}