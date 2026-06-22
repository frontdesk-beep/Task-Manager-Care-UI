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
if (typeof window !== 'undefined') {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  this.role = user?.role || '';
}}

  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

}
