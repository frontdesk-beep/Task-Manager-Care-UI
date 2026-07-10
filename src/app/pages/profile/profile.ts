import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import {ToastrService} from 'ngx-toastr';
import { UserStore } from '../../services/user-store';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  id = 0;
  name: string = '';
  email: string = '';
  role: string = '';
  editMode: boolean = false;
  private originalUser: any = null;

  constructor(
    private auth: Auth, 
    private router: Router, 
    private toastr: ToastrService,
    private userStore: UserStore) {}

  ngOnInit() {

    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (!stored.id) {
      this.router.navigate(['/login']);
      return;
    }
    this.id = stored.id;
    this.name = stored.name;
    this.email = stored.email;
    this.role = stored.role;
    this.loadProfile();
  }
loadProfile() {
  console.log('Loading profile...');
    this.auth.getProfile(this.id).subscribe({
      next: (res: any) => {
        this.name = res.name;
        this.email = res.email;
        this.role = res.role;

        this.originalUser = {
          id: this.id,
          name: res.name,
          email: res.email,
          role: res.role,
        };
      },
      error: (err) => {
        console.log(err);
        this.toastr.error('Failed to load profile');
      },
    });
}
  edit() {
    console.log('edit clicked...');
    this.editMode = true;
  }
  back(){
    console.log('back clicked...');
    this.router.navigate(['/main/dashboard']);
  }

  cancel() {
    console.log('cancel clicked...');
    if (this.originalUser) {
      this.name = this.originalUser.name;
      this.email = this.originalUser.email;
      this.role = this.originalUser.role;
    }
    this.editMode = false;
  }

  save() {
    console.log('save clicked...');
    const data = {
      name: this.name,
      email: this.email,
      role: this.role,
    };

    this.userStore.updateUser(this.id, data)
    .subscribe({
      next: () => {

        this.userStore.loadUser(this.id);

        this.toastr.success('Profile updated');
                        this.editMode = false;

      },
      error: (err) => {
        console.log(err);
        this.toastr.error('Update failed');
      },
    });
  }
}
