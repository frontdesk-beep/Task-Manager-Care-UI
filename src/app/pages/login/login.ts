import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { ToastrService } from 'ngx-toastr';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { finalize } from 'rxjs';

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
  isSubmitting: boolean = false;

  private readonly emailRegex = /^[A-Za-z0-9._%+-]+@careinsurance\.ca$/i;

  constructor(
    private auth: Auth,
    private router: Router,
    private toastr: ToastrService,
    private storage: BrowserStorageService) { }

  validateEmail(): boolean {
    const value = this.email.trim();
    if (!value) {
      this.emailError = 'Email is required.';
      return false;
    }
    if (value.length > 100) {
      this.emailError = 'Email cannot exceed 100 characters.';
      return false;
    }
    if (!this.emailRegex.test(value)) {
      this.emailError = 'Email must be a valid @careinsurance.ca address';
      return false;
    }
    this.emailError = '';
    return true;
  }

  validatePassword(): boolean {
    const value = this.password.trim();
    if (!value) {
      this.passwordError = 'Password is required.';
      return false;
    }
    
    // Login only checks presence, not complexity — the account's real
    // password may predate any complexity rule enforced at signup.
    this.passwordError = '';
    return true;
  }

  onSubmit() {
    const emailValid = this.validateEmail();
    const passwordValid = this.validatePassword();

    if (!emailValid || !passwordValid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    this.auth.login({ 
      email: this.email.trim(), 
      password: this.password
     }).pipe(
      finalize(()=>{
        this.isSubmitting=false;
      })
     )
      .subscribe({
        next: (res: any) => {
          this.storage.setItem('token', res.token);
          this.storage.setItem('user', JSON.stringify({
            id: res.id,
            name: res.name,
            email: res.email,
            role: res.role,
          }));
          // this.storage.setItem('name', res.name);
          // this.storage.setItem('email', res.email);
          // this.storage.setItem('role', res.role);
          // this.storage.setItem('isLoggedIn', res.token ? 'true' : 'false');
          
          this.toastr.success('Login successful!');
          this.router.navigate(['/main/dashboard']);
        },
        error: (error) => {
          this.isSubmitting = false;
          const message = error?.error?.message;

          if (error.status === 403) {
            this.toastr.error(message || 'This account has been deactivated. Contact admin.');
            return;
          }
          if (error.status === 401) {
            this.toastr.error(message || 'Invalid email or password.');
            return;
          }
          if (error.status === 400 && error?.error?.errors) {
            const firstError = Object.values(error.error.errors)[0] as string[];
            this.toastr.error(firstError?.[0] || 'Please check your input and try again.');
            return;
          }
          if (error.status === 0) {
            this.toastr.error('Unable to reach the server. Check your connection.');
            return;
          }
          this.toastr.error(message || 'Something went wrong.');
        }
      });
  }
}