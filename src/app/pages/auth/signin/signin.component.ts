import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Don't redirect automatically from signin page
    // Let users choose their path even if logged in
    console.log('SigninComponent: Loaded, isLoggedIn:', this.authService.isLoggedIn());
  }
  
  // Navigation methods for the landing page
  navigateToAdminLogin(): void {
    console.log('Navigating to admin login');
    this.router.navigate(['/auth/admin-login']);
  }
  
  navigateToStudentLogin(): void {
    console.log('Navigating to student login');
    this.router.navigate(['/auth/student-login']);
  }
  
  navigateToStudentSignup(event?: Event): void {
    console.log('Navigating to student signup');
    // Prevent any default behavior and navigate directly
    event?.preventDefault();
    this.router.navigate(['/auth/student-login'], { 
      queryParams: { tab: 'signup' } 
    });
  }
  
  navigateToSupport(event?: Event): void {
    console.log('Navigating to support');
    // Prevent any default behavior and navigate directly
    event?.preventDefault();
    this.router.navigate(['/support']);
  }
}