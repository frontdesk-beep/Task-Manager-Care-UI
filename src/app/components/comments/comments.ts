import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comments.html',
  styleUrl: './comments.css'
})
export class Comments implements OnInit, OnDestroy {
  @Input() taskId = 0;
  messages: any[] = [];
  newText = '';
  sub?: Subscription;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    if (!this.taskId) return;
    this.loadComments();
    this.sub = this.taskService.connectComments(this.taskId).subscribe({
      next: (m: any) => {
        if (!m) return;
        if (m.type === 'comment-added' && m.taskId === this.taskId) {
          this.messages.push(m.comment || m.payload || {});
        }
      },
      error: (err) => console.error('Comments socket err', err)
    });
  }

  loadComments() {
    this.taskService.GetComments(this.taskId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        this.messages = data;
      },
      error: (err) => console.error('Load comments err', err)
    });
  }

  send() {
    const text = (this.newText || '').trim();
    if (!text) return;
    const payload = { text };
    this.taskService.AddComment(this.taskId, payload).subscribe({
      next: (res: any) => {
        const comment = res || (res?.data) || payload;
        this.messages.push(comment);
        this.newText = '';
      },
      error: (err) => console.error('Send comment err', err)
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.taskService.disconnectComments();
  }
}
