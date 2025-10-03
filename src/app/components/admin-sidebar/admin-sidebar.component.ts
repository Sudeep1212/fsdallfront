import { Component, OnInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss']
})
export class AdminSidebarComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isDarkMode = false;
  currentUser: any = null;
  showAccountDropdown = false;
  showModulesDropdown = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    // Subscribe to auth changes to get real-time user data
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Also get immediate value
    this.currentUser = this.authService.getCurrentUser();
    
    // Load theme preference from localStorage (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('admin-theme');
      this.isDarkMode = savedTheme === 'dark';
      this.applyTheme();
    }
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('admin-theme', this.isDarkMode ? 'dark' : 'light');
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
  }

  toggleAccountDropdown(): void {
    this.showAccountDropdown = !this.showAccountDropdown;
    if (this.showAccountDropdown) {
      this.showModulesDropdown = false;
    }
  }

  toggleModulesDropdown(): void {
    this.showModulesDropdown = !this.showModulesDropdown;
    if (this.showModulesDropdown) {
      this.showAccountDropdown = false;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToModule(module: string): void {
    // Convert module name to plural lowercase for routing
    const moduleName = module.toLowerCase();
    const pluralMap: { [key: string]: string } = {
      'event': 'events',
      'club': 'clubs',
      'venue': 'venues',
      'volunteer': 'volunteers',
      'sponsor': 'sponsors',
      'budget': 'budgets',
      'department': 'departments',
      'result': 'results',
      'judge': 'judges',
      'participation': 'participations',
      'registration': 'registrations',
      'feedback': 'feedbacks',
      'admin': 'admins',
      'user': 'users',
      'comment': 'comments'
    };
    
    const route = pluralMap[moduleName] || moduleName;
    this.router.navigate([`/admin/modules/${route}`]);
    // Keep dropdown open - do NOT close it
    // this.showModulesDropdown = false;
  }

  // Check if current route is within modules section
  isModulesActive(): boolean {
    return this.router.url.includes('/admin/modules/');
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  getAdminName(): string {
    // Check if currentUser has 'name' property (Admin) or needs firstName + lastName (User)
    if (this.currentUser) {
      // Admin entity
      if ('name' in this.currentUser && this.currentUser.name) {
        return this.currentUser.name;
      }
      // User entity (fallback if needed)
      if ('firstName' in this.currentUser && 'lastName' in this.currentUser) {
        return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      }
    }
    return 'John Administrator';
  }

  getAdminEmail(): string {
    return this.currentUser?.email || 'admin@festflex.com';
  }

  // Close dropdowns when clicking outside
  closeDropdowns(): void {
    this.showAccountDropdown = false;
    this.showModulesDropdown = false;
  }

  // Admin-specific support (different from student support)
  openAdminSupport(): void {
    // Navigate to admin help page
    this.router.navigate(['/admin/help']);
    // Close any open dropdowns
    this.showAccountDropdown = false;
    this.showModulesDropdown = false;
  }
}