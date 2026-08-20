import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-remarks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './remarks.html',
  styleUrl: './remarks.css'
})
export class Remarks implements OnChanges, OnDestroy {

  @Input() taskId!: number;

  remarks: any[] = [];
  newRemark = '';

  private commentSub?: Subscription;
  private joinedTaskId?: number;

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskId'] && this.taskId) {
      this.loadRemarks();
      this.subscribeToLiveComments();
    }
  }

  ngOnDestroy(): void {
    this.commentSub?.unsubscribe();

    if (this.joinedTaskId) {
      this.notificationService.leaveTask(this.joinedTaskId);
    }
  }

  private subscribeToLiveComments() {
    // leave the previous task's group if taskId changed while component stayed alive
    if (this.joinedTaskId && this.joinedTaskId !== this.taskId) {
      this.notificationService.leaveTask(this.joinedTaskId);
    }

    this.notificationService.joinTask(this.taskId);
    this.joinedTaskId = this.taskId;

    this.commentSub?.unsubscribe();
    this.commentSub = this.notificationService.comment$.subscribe((data: any) => {
      if (data?.taskId === this.taskId && data?.comment) {
        // avoid duplicate if this client's own addRemark() already appended/refetched it
        const exists = this.remarks.some(r => r.id === data.comment.id);
        if (!exists) {
          this.remarks = [...this.remarks, data.comment];
          this.cdr.markForCheck();
        }
      }
    });
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