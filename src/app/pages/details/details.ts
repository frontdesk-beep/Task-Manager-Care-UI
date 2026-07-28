import { Component, Input } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css',
})
export class Details {
  constructor(){}
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
  
}