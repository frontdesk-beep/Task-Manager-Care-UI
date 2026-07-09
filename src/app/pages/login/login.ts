import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Router} from '@angular/router';
import { Auth } from '../../services/auth';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';
  emailError: string = '';
  passwordError: string = '';

  constructor(private auth: Auth, private router: Router, private toastr: ToastrService) {}

  validateEmail() {
    this.emailError = '';
    if (!this.email.trim()) {
      this.emailError = 'Email is required.';
      return;
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@careinsurance\.ca$/;
    if (!emailRegex.test(this.email)) {
      this.emailError = 'Please use your @careinsurance.ca email';
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
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify({
            id: res.id,
            name: res.name,
            email: res.email,
            role: res.role,
          }));
          this.toastr.success('Login successful!');
          localStorage.setItem('name', res.name);
          localStorage.setItem('email', res.email);
          localStorage.setItem('role', res.role);
          res.token ? localStorage.setItem('isLoggedIn', 'true') : localStorage.setItem('isLoggedIn', 'false');
          this.router.navigate(['/main/dashboard']);
          console.log(res);

        },
        error: (error) => {
          if(error.status === 403){
            this.toastr.error(
              'This account has been deactivated. Contact admin.'
            );
            return;
          }
          if(error.status === 401)
          {
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
