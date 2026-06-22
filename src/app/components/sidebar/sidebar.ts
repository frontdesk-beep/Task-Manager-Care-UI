import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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

ngOnInit() {

  const user = JSON.parse(localStorage.getItem('user') || '{}');

this.name = user?.name || '';
this.role = user?.role || '';
}
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

}
