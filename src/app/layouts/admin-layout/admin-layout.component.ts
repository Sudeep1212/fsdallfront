import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { AdminSidebarComponent } from '../../components/admin-sidebar/admin-sidebar.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  isDarkMode = false;

  ngOnInit(): void {
    // Verify admin access
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      this.router.navigate(['/auth/admin-login']);
      return;
    }
    
    // Load theme preference
    this.loadTheme();
  }
  
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('admin-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('admin-theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  }
}