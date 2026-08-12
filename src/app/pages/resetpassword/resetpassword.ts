import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-resetpassword',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './resetpassword.html',
  styleUrls: ['./resetpassword.css',
     '../../shared/styles/auth-card.css']
})
export class Resetpassword implements OnInit {
  
token: string = '';

  newPassword: string = '';

  confirmPassword: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastr: ToastrService,
    private auth: Auth
  ) { }

 ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      this.token = params['token'];

      if (!this.token) {
        this.toastr.error("Invalid password reset link.");
        this.router.navigate(['/login']);
      }

    });

  }

  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {

      this.toastr.warning("Please fill all fields.");

      return;

    }

    if (this.newPassword !== this.confirmPassword) {

      this.toastr.error("Passwords do not match.");

      return;

    }

    this.auth.resetPassword(this.token, this.newPassword)
      .subscribe({

        next: () => {
          this.toastr.success("Password reset successfully.");
          this.router.navigate(['/login']);
        },

        error: (error) => {
          this.toastr.error(
            error?.error?.message || "Unable to reset password."
          );

        }

      });

  }
}
