import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
name='';
  role='';

  constructor(private router: Router) {}

  ngOnInit() {
    this.name = localStorage.getItem('name') || '';
    this.role = localStorage.getItem('role') || '';
    console.log('Navbar initialized, role=', this.role);
  }
  

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    alert('Logged out successfully!');
    this.router.navigate(['/login']);
  }

}
