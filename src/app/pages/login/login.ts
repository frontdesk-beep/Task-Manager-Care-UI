import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { Auth } from '../../services/auth';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email: string = '';
  password: string = '';

  constructor(private auth: Auth, private router: Router, private toastr: ToastrService) {}

  onSubmit() {
    if (!this.email.trim() || !this.password.trim()) {
      this.toastr.warning('Please enter both email and password.');
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
