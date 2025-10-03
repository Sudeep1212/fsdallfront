import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { ChatbotIconComponent } from './components/shared/chatbot/chatbot-icon.component';
import { ChatbotSidebarComponent } from './components/shared/chatbot/chatbot-sidebar.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    ChatbotIconComponent,
    ChatbotSidebarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'FestFlex Events Management';
  isAdminRoute = false;
  
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize application
    console.log('🚀 FestFlex Application Started');
    console.log('🚀 NavbarComponent imported:', !!NavbarComponent);
    console.log('🚀 ChatbotIconComponent imported:', !!ChatbotIconComponent);
    console.log('🚀 ChatbotSidebarComponent imported:', !!ChatbotSidebarComponent);
    console.log('🚀 App component constructor running');
  }

  ngOnInit(): void {
    // Check for persisted admin session on app initialization
    this.checkAdminSession();
    
    // Listen to route changes to determine if we're on admin routes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAdminRoute = event.url.startsWith('/admin');
      });
  }

  private checkAdminSession(): void {
    // Only run in browser environment (not during SSR)
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Check if user data exists in localStorage
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        
        // If user has ADMIN role and is on the home/landing page, redirect to admin dashboard
        if (userData.role === 'ADMIN') {
          const currentUrl = this.router.url;
          // Only redirect if on home page or root, not if already on admin or auth pages
          if (currentUrl === '/' || currentUrl === '/home') {
            console.log('✅ Admin session detected - redirecting to admin dashboard');
            this.router.navigate(['/admin/dashboard']);
          }
        }
      }
    } catch (error) {
      console.error('Error checking admin session:', error);
      // If there's an error parsing userData, clear it
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('userData');
      }
    }
  }
}
