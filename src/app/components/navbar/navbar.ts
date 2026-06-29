import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../services/user-store';

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

  constructor(
    private router: Router,
    private userStore: UserStore
  ) {}

  ngOnInit() {
    console.log('Navbar initialized, role=', this.role);
    this.userStore.user$.subscribe(user=>{
      if(!user)
        return;
      this.name=user.name;
      this.role=user.role;
    });
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
