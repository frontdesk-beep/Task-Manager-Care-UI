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
  styleUrls: ['./forgotpassword.css', 
    '../../shared/styles/auth-card.css']
})
export class Forgotpassword {
  email: string = '';
  constructor(private auth: Auth, private router: Router, private toastr: ToastrService) {}   

  sendResetLink() {
    if(!this.email) {
      this.toastr.warning('Please enter your company email.');
      return;
    }
this.auth.forgotpassword(this.email).subscribe({
  next:() => {
    this.toastr.success(
    'A password reset link has been sent to your email.'
    );
    this.email='';
  },
      error : (error) => {
        this.toastr.error(
          error?.error?.message || 'Unable to send reset link.');
      }
});
  }}
