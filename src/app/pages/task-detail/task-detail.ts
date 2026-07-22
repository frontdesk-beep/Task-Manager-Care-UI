import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { Remarks } from '../remarks/remarks';
import { Activity } from '../activity/activity';
import { Details } from '../details/details';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule,
    Remarks,
    Activity,
    Details,
  ],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css'
})
export class TaskDetail implements OnInit {
  taskId = 0;
  task: any = null;
  
  loading = false;
  loadError: string | null = null;

  //tab switching
  activeTab = 'details';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id')) || 0;
      this.taskId = id;
      if (id) this.loadTask(id);
    });
  }

  loadTask(id: number) {
    this.loading = true;
    this.loadError = null;
    this.taskService.GetTaskById(id).subscribe({
      next: (res: any) => {
        this.task = res?.data ?? res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading task', err);
        this.loadError = (err?.statusText || err?.message || 'Failed to load task');
        this.loading = false;
      }
    });
  }
  setTab(tab: string) {
    this.activeTab = tab;
  }
  openInEditor() {
    // placeholder: navigate to create/edit page if exists
    this.router.navigate(['/main', 'create-task'], { queryParams: { id: this.taskId } });
  }
}
