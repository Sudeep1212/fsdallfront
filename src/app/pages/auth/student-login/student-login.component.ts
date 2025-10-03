import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest, RegisterRequest } from '../../../models/user.model';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './student-login.component.html',
  styleUrls: ['./student-login.component.scss']
})
export class StudentLoginComponent implements OnInit {
  loginForm: FormGroup;
  signupForm: FormGroup;
  activeTab: 'login' | 'signup' = 'login';
  loading = false;
  loginError = '';
  signupError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Initialize signup form
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      college: ['', [Validators.required]],
      contact: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Handle query parameters first
    this.route.queryParams.subscribe(params => {
      // Set the active tab based on query parameters
      if (params['tab'] === 'signup') {
        this.activeTab = 'signup';
      }
    });
    
    // Separate check for authentication redirect
    // Only redirect to dashboard if:
    // 1. User is logged in
    // 2. NOT accessing signup functionality
    // 3. Not on signup tab
    if (this.authService.isLoggedIn() && this.activeTab !== 'signup') {
      setTimeout(() => {
        // Use timeout to ensure query params are processed first
        if (this.activeTab !== 'signup') {
          this.router.navigate(['/dashboard']);
        }
      }, 100);
    }
  }

  // Custom validator for password confirmation
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  switchTab(tab: 'login' | 'signup'): void {
    // Clear any errors when switching tabs
    this.loginError = '';
    this.signupError = '';
    this.loading = false;
    
    // Switch the active tab
    this.activeTab = tab;
    
    // Reset forms when switching
    if (tab === 'login') {
      this.loginForm.reset();
    } else {
      this.signupForm.reset();
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.loginError = '';

      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          console.log('Student login successful:', response);
          this.loading = false;
          
          // Redirect based on user type
          if (this.authService.getCurrentUser()?.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          this.loginError = error.error?.message || 'Login failed. Please check your credentials and try again.';
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onSignup(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      this.signupError = '';

      const signupData: RegisterRequest = {
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
        email: this.signupForm.value.email,
        college: this.signupForm.value.college,
        contact: this.signupForm.value.contact,
        password: this.signupForm.value.password
      };

      this.authService.register(signupData).subscribe({
        next: (response) => {
          console.log('Student signup successful:', response);
          this.loading = false;
          
          // Redirect to dashboard after successful signup
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          console.error('Signup failed:', error);
          this.signupError = error.error?.message || 'Signup failed. Please try again.';
          this.loading = false;
        }
      });
    } else {
      this.markSignupFormGroupTouched();
    }
  }

  signUpWithGoogle(): void {
    // TODO: Implement Google OAuth integration for signup
    console.log('Google Sign-Up not yet implemented');
    alert('Google Sign-Up feature will be implemented soon!');
  }

  signInWithGoogle(): void {
    // TODO: Implement Google OAuth integration
    console.log('Google Sign-In not yet implemented');
    alert('Google Sign-In feature will be implemented soon!');
  }

  goBackToLanding(): void {
    this.router.navigate(['/']); // Navigate to home component instead of signin
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private markSignupFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }
}