import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { BrowserStorageService } from '../../services/browser-storage.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: [
    './login.css',
    '../../shared/styles/auth-card.css'
  ]
})
export class Login {
  email: string = '';
  password: string = '';
  emailError: string = '';
  passwordError: string = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private toastr: ToastrService,
    private storage: BrowserStorageService) { }

  validateEmail() {
    this.emailError = '';
    if (!this.email.trim()) {
      this.emailError = 'Email is required.';
      return;
    }
  }

  validatePassword() {
    this.passwordError = '';
    if (!this.password.trim()) {
      this.passwordError = 'Password is required.';
      return;
    }
    if (this.password.length < 8) {
      this.passwordError = 'Password must be at least 8 characters.';
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(this.password)) {
      this.passwordError = 'Invalid password format.';
      return;
    }
  }

  onSubmit() {
    this.validateEmail();
    this.validatePassword();

    if (this.emailError || this.passwordError) {
      return;
    }

    this.auth.login({ email: this.email, password: this.password })
      .subscribe({
        next: (res: any) => {
          this.storage.setItem('token', res.token);
          this.storage.setItem('user', JSON.stringify({
            id: res.id,
            name: res.name,
            email: res.email,
            role: res.role,
          }));
          this.toastr.success('Login successful!');
          this.storage.setItem('name', res.name);
          this.storage.setItem('email', res.email);
          this.storage.setItem('role', res.role);
          res.token ? this.storage.setItem('isLoggedIn', 'true') : this.storage.setItem('isLoggedIn', 'false');
          this.router.navigate(['/main/dashboard']);
        },

        error: (error) => {
          if (error.status === 403) {
            this.toastr.error(
              'This account has been deactivated. Contact admin.'
            );
            return;
          }
          if (error.status === 401) {
            this.toastr.error(
              'Invalid email or password.'
            );
            return;
          }
          this.toastr.error('Something went wrong.');

        }
      });
  }
}
