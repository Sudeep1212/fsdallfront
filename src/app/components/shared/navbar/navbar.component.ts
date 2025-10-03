import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { User, Admin } from '../../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  currentUser: User | Admin | null = null;
  isDarkMode = false;
  isUserDropdownOpen = false;
  
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state
    this.subscriptions.add(
      this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
      })
    );

    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user: User | Admin | null) => {
        this.currentUser = user;
      })
    );

    // Subscribe to theme state
    this.subscriptions.add(
      this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      })
    );

    // Close dropdown when clicking outside (only in browser)
    if (isPlatformBrowser(this.platformId)) {
      document.addEventListener('click', (event: Event) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-dropdown')) {
          this.isUserDropdownOpen = false;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.closeUserDropdown();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/signin']);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/auth/signup']);
  }

  // Helper methods for template
  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    if (this.isAdmin(this.currentUser)) {
      // Admin user
      return this.currentUser.name;
    } else {
      // Regular user
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    
    if (this.isAdmin(this.currentUser)) {
      // Admin user
      const names = this.currentUser.name.split(' ');
      return names.length > 1 
        ? `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}` 
        : names[0].charAt(0);
    } else {
      // Regular user
      return `${this.currentUser.firstName?.charAt(0) || ''}${this.currentUser.lastName?.charAt(0) || ''}`;
    }
  }

  getUserEmail(): string {
    if (!this.currentUser) return '';
    return this.currentUser.email;
  }

  getUserContact(): string {
    if (!this.currentUser) return '';
    
    if (this.isAdmin(this.currentUser)) {
      return ''; // Admins don't have contact info
    } else {
      return this.currentUser.contact || '';
    }
  }

  getUserCollege(): string {
    if (!this.currentUser) return '';
    
    if (this.isAdmin(this.currentUser)) {
      return 'Admin Access'; // Admin indicator
    } else {
      return this.currentUser.college || '';
    }
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  closeUserDropdown(): void {
    this.isUserDropdownOpen = false;
  }

  private isAdmin(user: User | Admin): user is Admin {
    return 'name' in user && 'adminId' in user && !('userId' in user);
  }

  handleCalendarClick(event: Event): void {
    if (!this.isLoggedIn) {
      event.preventDefault();
      this.showLoginRequiredPopup('Calendar', 'calendar');
    }
    // If logged in, let the routerLink handle navigation
  }

  handleResultsClick(event: Event): void {
    if (!this.isLoggedIn) {
      event.preventDefault();
      this.showLoginRequiredPopup('Results', 'results');
    }
    // If logged in, let the routerLink handle navigation
  }

  navigateToCalendar(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/calendar']);
    } else {
      // Show popup for login requirement
      this.showLoginRequiredPopup('Calendar', 'calendar');
    }
  }

  navigateToResults(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/results']);
    } else {
      // Show popup for login requirement
      this.showLoginRequiredPopup('Results', 'results');
    }
  }

  private showLoginRequiredPopup(featureName: string = 'Calendar', featureType: string = 'calendar'): void {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(12px);
        animation: fadeIn 0.3s ease-out;
      ">
        <div style="
          background: var(--glass-bg, rgba(255, 255, 255, 0.15));
          backdrop-filter: blur(30px);
          border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
          border-radius: 1.5rem;
          padding: 2.5rem;
          max-width: 450px;
          width: 90%;
          text-align: center;
          box-shadow: var(--glass-shadow, 0 8px 32px rgba(31, 38, 135, 0.2)), 0 20px 60px rgba(58, 114, 236, 0.15);
          position: relative;
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
          transform: translateY(0);
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(135deg, #3A72EC, #5B8CEF);
            border-radius: 1.5rem 1.5rem 0 0;
          "></div>
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(58, 114, 236, 0.03) 0%, transparent 70%);
            pointer-events: none;
          "></div>
          <div style="
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #3A72EC, #5B8CEF);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: 0 8px 25px rgba(58, 114, 236, 0.4);
            position: relative;
            z-index: 1;
          ">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              ${featureType === 'calendar' ? 
                `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                 <line x1="16" y1="2" x2="16" y2="6"/>
                 <line x1="8" y1="2" x2="8" y2="6"/>
                 <line x1="3" y1="10" x2="21" y2="10"/>` :
                `<path d="M9 11H15"/>
                 <path d="M9 15H12"/>
                 <path d="M16 6L18.29 8.29C18.3834 8.38373 18.4572 8.49813 18.5065 8.6244C18.5558 8.75067 18.5794 8.88615 18.5758 9.02195C18.5722 9.15775 18.5415 9.29142 18.4852 9.41441C18.4289 9.5374 18.3482 9.64705 18.248 9.736L9 19H5V15L14.29 5.71C14.3834 5.61663 14.4981 5.54284 14.6244 5.49354C14.7507 5.44424 14.8862 5.42058 15.022 5.42405C15.1578 5.42753 15.2914 5.45805 15.4144 5.51395C15.5374 5.56986 15.6471 5.6502 15.736 5.75L16 6Z"/>`
              }
            </svg>
          </div>
          <h3 style="
            color: var(--text-primary, #1e293b); 
            margin-bottom: 1rem; 
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #3A72EC, #5B8CEF);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
            z-index: 1;
          ">Login Required</h3>
          <p style="
            color: var(--text-secondary, #64748b); 
            margin-bottom: 2rem; 
            line-height: 1.6;
            font-size: 1.1rem;
            position: relative;
            z-index: 1;
          ">
            You need to login to access the ${featureName.toLowerCase()} feature. Please sign in to continue and explore your personalized ${featureName.toLowerCase()}.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; position: relative; z-index: 1;">
            <button id="loginBtn" style="
              background: linear-gradient(135deg, #3A72EC, #5B8CEF);
              color: white;
              border: none;
              padding: 1rem 2rem;
              border-radius: 1rem;
              cursor: pointer;
              font-weight: 600;
              font-size: 1rem;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(58, 114, 236, 0.3);
              position: relative;
              overflow: hidden;
            ">Sign In</button>
            <button id="closeBtn" style="
              background: var(--glass-bg, rgba(255, 255, 255, 0.1));
              color: var(--text-secondary, #64748b);
              border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
              padding: 1rem 2rem;
              border-radius: 1rem;
              cursor: pointer;
              font-weight: 600;
              font-size: 1rem;
              transition: all 0.3s ease;
              backdrop-filter: blur(10px);
            ">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Add click handlers
    popup.querySelector('#loginBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
      this.navigateToLogin();
    });
    
    popup.querySelector('#closeBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
    });
    
    // Close on backdrop click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        document.body.removeChild(popup);
      }
    });
  }
}
