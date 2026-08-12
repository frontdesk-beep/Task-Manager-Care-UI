import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification';

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

  private commentSub?: Subscription;


  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) { }


  ngOnInit() {

    if (!this.taskId) {
      return;
    }


    // Load old comments
    this.loadComments();


    // Join SignalR task room
    this.notificationService
      .joinTask(this.taskId)
      .catch(err =>
        console.error("Join task error", err)
      );


    // Listen realtime comments
    this.commentSub =
      this.notificationService.comment$
        .subscribe((data: any) => {
          if (data.taskId === this.taskId) {
            this.messages.push(
              data.comment
            );
          }
        });
  }

  loadComments() {

    this.taskService
      .GetComments(this.taskId)
      .subscribe({

        next: (res: any) => {

          this.messages =
            Array.isArray(res)
              ? res
              : (res?.data || []);

        },

        error: (err) => {
          console.error(
            "Load comments error",
            err
          );
        }

      });

  }



  send() {

    const text =
      this.newText.trim();

    if (!text)
      return;

    this.taskService
      .AddComment(
        this.taskId,
        { text }
      )
      .subscribe({

        next: () => {

          this.newText = '';

        },

        error: (err) => {

          console.error(
            "Send comment error",
            err
          );

        }

      });

  }



  ngOnDestroy() {

    this.commentSub?.unsubscribe();


    this.notificationService
      .leaveTask(this.taskId)
      .catch(err =>
        console.error(
          "Leave task error",
          err
        )
      );

  }

}