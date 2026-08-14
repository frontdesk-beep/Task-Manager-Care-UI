import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../services/user-store';
import { BrowserStorageService } from '../../services/browser-storage.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
name='';
role='';

  constructor(
    private router: Router,
    private userStore: UserStore,
    private storage: BrowserStorageService
  ) {}

  ngOnInit() {
    this.userStore.user$.subscribe(user=>{
      if(!user)
        return;
      this.name=user.name;
      this.role=user.role;
    });
  }
  

  logout() {
    // localStorage.removeItem('token');
    // localStorage.removeItem('name');
    // localStorage.removeItem('role');
    // localStorage.removeItem('user');
    // localStorage.removeItem('isLoggedIn');
    this.storage.removeItem('token');
    this.storage.removeItem('name');
    this.storage.removeItem('role');
    this.storage.removeItem('user');
    this.storage.removeItem('isLoggedIn');
    alert('Logged out successfully!');
    this.router.navigate(['/login']);
  }

}
