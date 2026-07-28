import { Component } from '@angular/core';
import { HeaderTop } from '../../components/header-top/header-top';
import { Sidebar } from '../../components/sidebar/sidebar';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserStore } from '../../services/user-store';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  imports: [HeaderTop, Sidebar, RouterOutlet, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})

export class MainLayout {
  constructor(
    private userStore: UserStore,
    private storage: BrowserStorageService,
   @Inject(PLATFORM_ID) private platformId: Object){}
  name = '';
  role = '';
  showSidebar = true;
  ngOnInit() {
     if (!isPlatformBrowser(this.platformId)) {
    return; // skip all data loading on the server
  }
if (typeof window !== 'undefined') {
  const user = JSON.parse(this.storage.getItem('user') || '{}');
  this.role = user?.role || '';
  if(user.id){
    this.userStore.setUser(user);
  }
}}
  toggleSidebar() {
    this.showSidebar = !this.showSidebar;
  }

}
