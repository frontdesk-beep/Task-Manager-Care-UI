import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar {
  role = '';
  dropdownOpen = false;
  name='';
constructor(
  private storage: BrowserStorageService,
   @Inject(PLATFORM_ID) private platformId: Object
  ){}
ngOnInit() {
  
 if (!isPlatformBrowser(this.platformId)) {
    return; // skip all data loading on the server
  }
  const user = JSON.parse(this.storage.getItem('user') || '{}');

this.name = user?.name || '';
this.role = user?.role || '';
}
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

}
