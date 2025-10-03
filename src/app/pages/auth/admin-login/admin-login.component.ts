import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../../models/user.model';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent implements OnInit {
  adminForm: FormGroup;
  adminLoading = false;
  adminError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.adminForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.adminEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // If already logged in, redirect to appropriate dashboard
    if (this.authService.isLoggedIn()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }
  }

  // Custom validator for admin email
  adminEmailValidator(control: any) {
    const email = control.value;
    if (email && !email.endsWith('@admin.org')) {
      return { adminEmail: true };
    }
    return null;
  }

  onAdminLogin(): void {
    if (this.adminForm.valid) {
      this.adminLoading = true;
      this.adminError = '';

      const loginData: LoginRequest = this.adminForm.value;

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Admin login successful:', response);
          this.adminLoading = false;
          
          // Verify the user is actually an admin
          const user = this.authService.getCurrentUser();
          if (user?.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.adminError = 'Access denied. Admin credentials required.';
            this.authService.logout(); // Log out non-admin user
          }
        },
        error: (error) => {
          console.error('Admin login failed:', error);
          this.adminError = error.error?.message || 'Invalid admin credentials. Please try again.';
          this.adminLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  contactSupport(): void {
    // Navigate directly to support page's contact information section
    this.router.navigate(['/support'], { fragment: 'contact-info' });
  }

  goBackToLanding(): void {
    this.router.navigate(['/']); // Navigate to home component instead of signin
  }

  private markFormGroupTouched(): void {
    Object.keys(this.adminForm.controls).forEach(key => {
      const control = this.adminForm.get(key);
      control?.markAsTouched();
    });
  }
}