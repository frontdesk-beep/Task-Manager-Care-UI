import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {Router} from '@angular/router';
import { Auth } from '../../services/auth';
import {ToastrService} from 'ngx-toastr';


@Component({
  selector: 'app-forgotpassword',
  imports: [RouterLink, FormsModule],
  templateUrl: './forgotpassword.html',
  styleUrl: './forgotpassword.css',
})
export class Forgotpassword {
  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private auth: Auth, private router: Router, private toastr: ToastrService) {}   

  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.toastr.warning('Passwords do not match!');
      return;
    }
    const data = { email: this.email, newPassword: this.newPassword, confirmPassword: this.confirmPassword };
    this.auth.forgotpassword(data).subscribe(
      response => {
        this.toastr.success('Password reset successful! Please log in with your new password.');
        this.router.navigate(['/login']);
      },
      error => {
        console.log(error);
        this.toastr.error(error?.error?.message || 'Error resetting password. Please try again.');
      }
    );
  }
}
