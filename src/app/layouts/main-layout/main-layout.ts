import { Component } from '@angular/core';
import { HeaderTop } from '../../components/header-top/header-top';
import { Sidebar } from '../../components/sidebar/sidebar';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-main-layout',
  imports: [HeaderTop, Sidebar, RouterOutlet, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  name = '';
  role = '';
  showSidebar = true;

  ngOnInit() {
    this.name = localStorage.getItem('name') || '';
    this.role = localStorage.getItem('role') || '';
  }

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

}
