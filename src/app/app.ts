import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SignalrService } from './services/signalr';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // protected readonly title = signal('task-manager');
  showSidebar = true;

  constructor(
    private signalrService: SignalrService
  ) { }

  ngOnInit() {
    this.signalrService.startConnection();
  }
  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }
}

