import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { EventService } from '../../services/event.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { FeedbackService } from '../../services/feedback.service';
import { FooterComponent } from '../../components/shared/footer/footer.component';
import { CommentModalComponent } from '../../components/comment-modal/comment-modal.component';
import { Event } from '../../models/event.model';
import { Comment } from '../../models/comment.model';
import { User, Admin } from '../../models/user.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent, CommentModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('interactiveCharacter', { static: false }) interactiveCharacter!: ElementRef;

  // Data properties
  upcomingEvents: Event[] = [];
  nextEvent: Event | null = null;
  recentComments: Comment[] = [];
  isLoggedIn = false;
  favoriteEvents: Set<number> = new Set();
  completedEventsCount = 0;
  isRefreshingEvents = false;
  private componentDestroyed = false;
  
  // Background image path
  backgroundImageUrl = 'assets/images/bg-image.png';
  isDarkMode = false;
  
  // Getter for background style - pure image without gradient overlay
  get heroBackgroundStyle(): string {
    return `url(${this.backgroundImageUrl})`;
  }

  // ViewChild for character playground
  @ViewChild('characterPlayground') characterPlayground!: ElementRef;

  // Interactive Character Properties
  characterTransform = 'translate(-50%, -50%)';
  isCharacterHovered = false;
  showCharacterGlow = false;
  hideInteractionHint = false;
  showSpeechBubble = false;
  
  // Feedback overlay properties
  showFeedbackOverlay = false;
  feedbackOverlayTimeout: any;
  speechBubbleText = '';
  
  // Comment modal properties
  showCommentModal = false;
  
  // Cursor trail and particles
  cursorTrail: Array<{id: number, x: number, y: number, emoji: string}> = [];
  particles: Array<{id: number, x: number, y: number, emoji: string, delay?: number}> = [];
  
  // Speech bubble messages
  speechMessages = [
    "Welcome to FestFlex! 🎉",
    "Ready to explore amazing events? ✨",
    "Click me for a surprise! 🎊", 
    "Let's find your perfect event! �",
    "Join the celebration! �"
  ];
  
  // Emoji arrays for effects
  cursorEmojis = ['✨', '⭐', '🌟', '💫', '🎯'];
  celebrationEmojis = ['🎉', '🎊', '🎈', '🎁', '🎀', '🎪', '🎭', '🎨'];

  // Event images array - 22 unique professional images
  eventImages = [
    'assets/images/Event-Images/istockphoto-1166978137-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1175031702-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1300014142-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1349104991-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1371940128-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1443245439-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1450957578-640x640.avif',
    'assets/images/Event-Images/istockphoto-1453378098-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1455935808-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1483272796-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1488588152-640x640.avif',
    'assets/images/Event-Images/istockphoto-171592241-612x612.jpg',
    'assets/images/Event-Images/istockphoto-1979771761-612x612.jpg',
    'assets/images/Event-Images/istockphoto-2189800011-612x612.jpg',
    'assets/images/Event-Images/istockphoto-2189800037-612x612.jpg',
    'assets/images/Event-Images/istockphoto-2226813113-612x612.jpg',
    'assets/images/Event-Images/istockphoto-469711926-612x612.jpg',
    'assets/images/Event-Images/istockphoto-499517325-612x612.jpg',
    'assets/images/Event-Images/istockphoto-532256991-612x612.jpg',
    'assets/images/Event-Images/istockphoto-597958786-612x612.jpg',
    'assets/images/Event-Images/istockphoto-628483496-612x612.jpg',
    'assets/images/Event-Images/istockphoto-944251112-612x612.jpg'
  ];

  // Timer properties
  timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  // Pagination for events
  currentEventPage = 0;
  eventsPerPage = 9;
  totalEventPages = 0;

  private subscriptions = new Subscription();
  private timerInterval: any;

  constructor(
    private eventService: EventService,
    private commentService: CommentService,
    private authService: AuthService,
    private themeService: ThemeService,
    private feedbackService: FeedbackService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.subscribeToAuth();
    this.subscribeToTheme();
    this.startEventTimer();
    this.loadCompletedEventsCount();
    this.testBackendConnection();
    this.checkForAuthRedirect();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeCharacterAnimation();
    }
  }

  ngOnDestroy(): void {
    this.componentDestroyed = true;
    this.subscriptions.unsubscribe();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.feedbackOverlayTimeout) {
      clearTimeout(this.feedbackOverlayTimeout);
    }
  }

  private loadData(): void {
    // Only load data in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      console.log('⏭️ Skipping data load during SSR');
      return;
    }

    // Load upcoming events with filtering
    this.subscriptions.add(
      this.eventService.getUpcomingEvents().subscribe({
        next: (events: Event[]) => {
          console.log('📥 Received events from backend:', events);
          // Filter out past events
          this.upcomingEvents = this.filterUpcomingEvents(events);
          this.calculateEventPagination();
          console.log('✅ Loaded', this.upcomingEvents.length, 'upcoming events (past events filtered)');
          console.log('📋 Upcoming events:', this.upcomingEvents);
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error fetching upcoming events:', error);
          // Fallback to mock data if backend is unavailable
          this.loadMockEvents();
        }
      })
    );

    // Load next event for timer
    this.subscriptions.add(
      this.eventService.getNextEvent().subscribe({
        next: (event: Event) => {
          console.log('⏰ Next event received:', event);
          this.nextEvent = event;
          // Force change detection
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error fetching next event:', error);
          // Fallback to mock next event
          this.loadMockNextEvent();
        }
      })
    );

    // Load recent comments
    this.subscriptions.add(
      this.commentService.getRecentComments(3).subscribe({
        next: (comments: Comment[]) => {
          this.recentComments = comments;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching recent comments:', error);
          this.recentComments = [];
          this.cdr.detectChanges();
        }
      })
    );
  }

  private subscribeToAuth(): void {
    this.subscriptions.add(
      this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
        const wasLoggedOut = !this.isLoggedIn;
        this.isLoggedIn = isLoggedIn;
        
        // Show feedback overlay after successful login (with delay)
        if (isLoggedIn && wasLoggedOut) {
          this.showFeedbackOverlayAfterLogin();
        }
      })
    );
  }

  private subscribeToTheme(): void {
    this.subscriptions.add(
      this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      })
    );
  }

  // Feedback overlay methods
  private showFeedbackOverlayAfterLogin(): void {
    // Get current user to check email
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user: User | Admin | null) => {
        if (user && user.email) {
          // Check if user has already submitted feedback
          const hasSubmittedFeedback = this.feedbackService.hasFeedbackBeenSubmitted(user.email);
          
          if (!hasSubmittedFeedback) {
            // Delay showing the overlay to let the page load fully
            this.feedbackOverlayTimeout = setTimeout(() => {
              if (this.isLoggedIn && !this.componentDestroyed) {
                this.showFeedbackOverlay = true;
              }
            }, 2000); // 2 second delay after login
          }
        }
      })
    );
  }

  closeFeedbackOverlay(): void {
    this.showFeedbackOverlay = false;
    if (this.feedbackOverlayTimeout) {
      clearTimeout(this.feedbackOverlayTimeout);
    }
  }

  private checkForAuthRedirect(): void {
    this.route.queryParams.subscribe(params => {
      if (params['showLogin'] === 'true' && params['feature'] && isPlatformBrowser(this.platformId)) {
        const featureName = params['feature'] === 'calendar' ? 'Calendar' : 'Results';
        // Delay to ensure the component is fully loaded
        setTimeout(() => {
          this.showLoginRequiredPopup(`access the ${featureName.toLowerCase()}`);
        }, 500);
      }
    });
  }

  openFeedbackForm(): void {
    this.closeFeedbackOverlay();
    // Navigate to feedback form (we'll create this route)
    this.router.navigate(['/feedback']);
  }

  private startEventTimer(): void {
    // Only start timer in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.timerInterval = setInterval(() => {
      this.updateEventTimer();
    }, 1000);
  }

  private updateEventTimer(): void {
    if (!this.nextEvent) {
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    const dateString = this.nextEvent.event_start_date + ' ' + this.nextEvent.event_time;
    const eventDate = new Date(dateString);
    const now = new Date();
    const difference = eventDate.getTime() - now.getTime();
    
    // Handle invalid date parsing
    if (isNaN(eventDate.getTime())) {
      console.error('Invalid date parsing:', dateString);
      this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return;
    }

    if (difference > 0) {
      this.timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    } else {
      // Current event has started, find the next event
      if (!this.isRefreshingEvents && !this.componentDestroyed) {
        this.timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        // Prevent multiple refresh calls
        this.isRefreshingEvents = true;
        
        // Refresh both upcoming events and next event
        setTimeout(() => {
          if (!this.componentDestroyed) {
            this.refreshEventsData();
          }
        }, 1000);
      }
    }
  }

  // Method to refresh events data when an event starts
  private refreshEventsData(): void {
    if (this.componentDestroyed) {
      console.log('⚠️ Component destroyed, skipping events refresh');
      return;
    }
    
    console.log('🔄 Refreshing events data...');
    
    // Reload upcoming events with updated filter
    this.subscriptions.add(
      this.eventService.getUpcomingEvents().subscribe({
        next: (events: Event[]) => {
          if (!this.componentDestroyed) {
            this.upcomingEvents = this.filterUpcomingEvents(events);
            this.calculateEventPagination();
            console.log('✅ Refreshed upcoming events:', this.upcomingEvents.length, 'events');
          }
        },
        error: (error) => {
          console.error('Error refreshing upcoming events:', error);
          if (!this.componentDestroyed) {
            this.isRefreshingEvents = false; // Reset flag on error too
          }
        }
      })
    );

    // Reload next event for timer
    this.subscriptions.add(
      this.eventService.getNextEvent().subscribe({
        next: (event: Event) => {
          if (!this.componentDestroyed) {
            this.nextEvent = event;
            this.isRefreshingEvents = false; // Reset the flag
            console.log('✅ New next event for timer:', event?.event_name || 'No more events');
          }
        },
        error: (error) => {
          console.error('Error fetching new next event:', error);
          if (!this.componentDestroyed) {
            this.nextEvent = null; // No more events
            this.isRefreshingEvents = false; // Reset the flag
          }
        }
      })
    );
  }

  private calculateEventPagination(): void {
    this.totalEventPages = Math.ceil(this.upcomingEvents.length / this.eventsPerPage);
  }

  private initializeCharacterAnimation(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      // Initialize particles
      this.initializeParticles();
      
      // Load Tenor embed script
      this.loadTenorScript();
      
      console.log('Interactive character initialized successfully');
      
    } catch (error) {
      console.log('Character animation initialization failed:', error);
    }
  }

    // Interactive character methods
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.characterPlayground) {
      const rect = this.characterPlayground.nativeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      
      const deltaX = (mouseX - centerX) / 10;
      const deltaY = (mouseY - centerY) / 10;
      
      this.characterTransform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
      
      // Add cursor trail effect
      this.addCursorTrail(mouseX - rect.left, mouseY - rect.top);
    }
  }

  onCharacterHover(): void {
    this.isCharacterHovered = true;
    this.speechBubbleText = this.speechMessages[Math.floor(Math.random() * this.speechMessages.length)];
    this.showSpeechBubble = true;
    this.showCharacterGlow = true;
    this.hideInteractionHint = true;
  }

  onCharacterLeave(): void {
    this.isCharacterHovered = false;
    this.showSpeechBubble = false;
    this.showCharacterGlow = false;
    this.hideInteractionHint = false;
    this.characterTransform = 'translate(-50%, -50%)';
  }

  onCharacterClick(): void {
    // Trigger celebration animation
    this.triggerCelebration();
    
    // Change speech bubble
    this.speechBubbleText = "🎉 Thanks for clicking! Let's explore events together!";
    this.showSpeechBubble = true;
    
    // Hide speech bubble after 3 seconds
    setTimeout(() => {
      this.showSpeechBubble = false;
    }, 3000);
  }

  private addCursorTrail(x: number, y: number): void {
    const trail = {
      id: Date.now(),
      x: x,
      y: y,
      emoji: this.cursorEmojis[Math.floor(Math.random() * this.cursorEmojis.length)]
    };
    
    this.cursorTrail.push(trail);
    
    // Remove trail after animation
    setTimeout(() => {
      this.cursorTrail = this.cursorTrail.filter(t => t.id !== trail.id);
    }, 1000);
    
    // Limit trail length
    if (this.cursorTrail.length > 15) {
      this.cursorTrail.shift();
    }
  }

  private triggerCelebration(): void {
    // Add celebration particles
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const particle = {
          id: Date.now() + i,
          x: Math.random() * 400,
          y: Math.random() * 400,
          emoji: this.celebrationEmojis[Math.floor(Math.random() * this.celebrationEmojis.length)]
        };
        
        this.particles.push(particle);
        
        // Remove particle after animation
        setTimeout(() => {
          this.particles = this.particles.filter(p => p.id !== particle.id);
        }, 4000);
      }, i * 100);
    }
  }

  private showSpeech(message: string): void {
    this.speechBubbleText = message;
    this.showSpeechBubble = true;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.showSpeechBubble = false;
    }, 3000);
  }

  private initializeParticles(): void {
    const particleEmojis = ['✨', '🎉', '💫', '⭐', '🌟', '💝', '🎊'];
    
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: Date.now() + i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        emoji: particleEmojis[Math.floor(Math.random() * particleEmojis.length)],
        delay: Math.random() * 5
      });
    }
  }

  private createParticleBurst(): void {
    const burstEmojis = ['🎉', '🎊', '✨', '💫', '🌟'];
    const centerX = 200;
    const centerY = 200;
    
    // Add burst particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const distance = 50 + Math.random() * 50;
      
      this.particles.push({
        id: Date.now() + i,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        emoji: burstEmojis[Math.floor(Math.random() * burstEmojis.length)],
        delay: 0
      });
    }
    
    // Remove burst particles after animation
    setTimeout(() => {
      this.particles = this.particles.slice(0, 8); // Keep only original particles
    }, 2000);
  }

  private loadTenorScript(): void {
    if (typeof document !== 'undefined') {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://tenor.com/embed.js';
      document.head.appendChild(script);
    }
  }

  // Event pagination methods
  getCurrentPageEvents(): Event[] {
    const startIndex = this.currentEventPage * this.eventsPerPage;
    return this.upcomingEvents.slice(startIndex, startIndex + this.eventsPerPage);
  }

  goToEventPage(page: number): void {
    if (page >= 0 && page < this.totalEventPages) {
      this.currentEventPage = page;
    }
  }

  getEventPageNumbers(): number[] {
    return Array.from({ length: this.totalEventPages }, (_, i) => i);
  }

  // Navigation methods
  registerForEvent(event: Event): void {
    if (this.isLoggedIn) {
      // Navigate to registration page
      this.router.navigate(['/event-registration', event.event_id]);
    } else {
      // Show popup for login requirement
      this.showLoginRequiredPopup('register for this event');
    }
  }

  addComment(): void {
    if (this.isLoggedIn) {
      this.showCommentModal = true;
    } else {
      // Show popup for login requirement
      this.showLoginRequiredPopup('comment on this post');
    }
  }

  // Smooth scroll to events section
  scrollToEvents(): void {
    const eventsSection = document.getElementById('events-section');
    if (eventsSection) {
      eventsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  onCommentModalClose(): void {
    this.showCommentModal = false;
  }

  onCommentAdded(comment: Comment): void {
    // Add the new comment to the beginning of the array
    this.recentComments.unshift(comment);
    // Keep only the latest 3 comments for display
    if (this.recentComments.length > 3) {
      this.recentComments = this.recentComments.slice(0, 3);
    }
    this.cdr.detectChanges();
  }

  private showLoginRequiredPopup(action: string): void {
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
              <path d="M9 12l2 2 4-4"/>
              <circle cx="12" cy="12" r="9"/>
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
            You need to login to ${action}. Please sign in to continue and access this feature.
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
              backdrop-filter: blur(15px);
            ">Cancel</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        #loginBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(58, 114, 236, 0.4) !important;
        }
        #closeBtn:hover {
          background: rgba(58, 114, 236, 0.1) !important;
          border-color: rgba(58, 114, 236, 0.3) !important;
          transform: translateY(-2px);
        }
      </style>
    `;
    
    document.body.appendChild(popup);
    
    // Add click handlers
    popup.querySelector('#loginBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
      this.router.navigate(['/auth/signin']);
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

  showCalendarPopup(): void {
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
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: var(--glass-shadow, 0 8px 32px rgba(31, 38, 135, 0.2)), 0 20px 60px rgba(58, 114, 236, 0.15);
          position: relative;
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
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
          ">Event Calendar</h3>
          <p style="
            color: var(--text-secondary, #64748b); 
            margin-bottom: 2rem; 
            line-height: 1.6;
            font-size: 1.1rem;
            position: relative;
            z-index: 1;
          ">
            View all upcoming events in our interactive calendar. Stay updated with the latest event schedules and never miss an important date!
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; position: relative; z-index: 1;">
            <button id="openCalendarBtn" style="
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
            ">Open Calendar</button>
            <button id="closeCalendarBtn" style="
              background: var(--glass-bg, rgba(255, 255, 255, 0.1));
              color: var(--text-secondary, #64748b);
              border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
              padding: 1rem 2rem;
              border-radius: 1rem;
              cursor: pointer;
              font-weight: 600;
              font-size: 1rem;
              transition: all 0.3s ease;
              backdrop-filter: blur(15px);
            ">Close</button>
          </div>
        </div>
      </div>
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        #openCalendarBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(58, 114, 236, 0.4) !important;
        }
        #closeCalendarBtn:hover {
          background: rgba(58, 114, 236, 0.1) !important;
          border-color: rgba(58, 114, 236, 0.3) !important;
          transform: translateY(-2px);
        }
      </style>
    `;
    
    document.body.appendChild(popup);
    
    // Add click handlers
    popup.querySelector('#openCalendarBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
      // TODO: Navigate to calendar page
      console.log('Opening calendar page');
    });
    
    popup.querySelector('#closeCalendarBtn')?.addEventListener('click', () => {
      document.body.removeChild(popup);
    });
    
    // Close on backdrop click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        document.body.removeChild(popup);
      }
    });
  }

  viewMoreComments(): void {
    // Load all comments instead of just recent ones
    this.subscriptions.add(
      this.commentService.getAllComments().subscribe({
        next: (comments: Comment[]) => {
          this.recentComments = comments.slice(0, 10); // Show up to 10 comments
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching more comments:', error);
        }
      })
    );
  }
  
  // Mock data methods for fallback when backend is unavailable
  private loadMockEvents(): void {
    const mockEvents = [
      {
        event_id: 1,
        event_name: 'Annual Tech Fest 2025',
        event_description: 'A grand celebration of technology and innovation',
        event_start_date: '2025-10-15',
        event_end_date: '2025-10-17',
        event_time: '09:00 AM',
        event_type: 'Technical',
        venue: { venue_id: 1, name: 'Main Auditorium', floor: 1 },
        club: { club_id: 1, name: 'Tech Club', presidentName: 'John Doe', presidentContact: '1234567890', presidentEmail: 'john@techclub.com' }
      },
      {
        event_id: 2,
        event_name: 'Cultural Night',
        event_description: 'An evening of music, dance, and cultural performances',
        event_start_date: '2025-10-20',
        event_end_date: '2025-10-20',
        event_time: '06:00 PM',
        event_type: 'Cultural',
        venue: { venue_id: 2, name: 'Open Air Theatre', floor: 0 },
        club: { club_id: 2, name: 'Cultural Club', presidentName: 'Jane Smith', presidentContact: '0987654321', presidentEmail: 'jane@culturalclub.com' }
      },
      {
        event_id: 3,
        event_name: 'Sports Championship',
        event_description: 'Inter-college sports competition',
        event_start_date: '2025-10-25',
        event_end_date: '2025-09-27',
        event_time: '08:00 AM',
        event_type: 'Sports',
        venue: { venue_id: 3, name: 'Sports Complex', floor: 0 },
        club: { club_id: 3, name: 'Sports Club', presidentName: 'Mike Johnson', presidentContact: '1122334455', presidentEmail: 'mike@sportsclub.com' }
      }
    ];
    
    // Filter out past events from mock data
    this.upcomingEvents = this.filterUpcomingEvents(mockEvents);
    this.calculateEventPagination();
    console.log('✅ Loaded', this.upcomingEvents.length, 'upcoming mock events (past events filtered)');
  }

  private loadMockNextEvent(): void {
    // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.nextEvent = {
        event_id: 1,
        event_name: "Annual Tech Fest 2025",
        event_description: "A grand celebration of technology and innovation",
        event_start_date: "2025-09-15",
        event_end_date: "2025-09-17",
        event_time: "09:00:00",
        event_type: "Technical",
        venue_id: 1,
        club_id: 1,
        judge_id: 1
      };
    }, 0);
  }

  // Helper method to get user initials from full name (for comment avatars)
  getCommentUserInitials(userName: string): string {
    if (!userName) return 'U';
    
    const name = userName.trim();
    if (name.includes(' ')) {
      // If name has space, use first letter of each word
      const parts = name.split(' ').filter(part => part.length > 0);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
      }
    }
    
    // Fallback - use first two letters or just first if too short
    return name.length > 1 ? 
      `${name.charAt(0).toUpperCase()}${name.charAt(1).toUpperCase()}` : 
      name.charAt(0).toUpperCase();
  }
  
  // Test backend connectivity
  private testBackendConnection(): void {
    // Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Simple API health check
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        console.log('✅ Backend connected successfully! Found', events.length, 'events');
      },
      error: (error) => {
        console.log('⚠️  Backend not available, using mock data. Error:', error.message);
      }
    });
  }

  // Get unique image for each event based on event ID
  getEventImage(eventId: number): string {
    // Use event ID to ensure consistent image assignment
    const imageIndex = (eventId - 1) % this.eventImages.length;
    return this.eventImages[imageIndex];
  }

  // Get date number for the date badge
  getDateNumber(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  }

  // Get month abbreviation for the date badge
  getDateMonth(dateStr: string): string {
    const date = new Date(dateStr);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                   'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[date.getMonth()];
  }

  // Format event date for display
  formatEventDate(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  // Get attendee avatars (mock data for now)
  getAttendeeAvatars(): string[] {
    return [
      'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
    ];
  }

  // View event details method
  viewEventDetails(event: any): void {
    console.log('Viewing details for event:', event.event_name);
    // Navigate to the same event registration page
    if (this.isLoggedIn) {
      this.router.navigate(['/event-registration', event.event_id]);
    } else {
      // Show popup for login requirement
      this.showLoginRequiredPopup('view details for this event');
    }
  }

  // Toggle favorite status for events
  toggleFavorite(eventId: number): void {
    if (this.favoriteEvents.has(eventId)) {
      this.favoriteEvents.delete(eventId);
    } else {
      this.favoriteEvents.add(eventId);
    }
  }

  // Check if event is favorited
  isFavorite(eventId: number): boolean {
    return this.favoriteEvents.has(eventId);
  }

  // Filter out events that have already started from the display
  private filterUpcomingEvents(events: any[]): any[] {
    const now = new Date();
    
    return events.filter(event => {
      // Handle both possible date field names
      const eventStartDateStr = event.date || event.event_start_date;
      const eventTimeStr = event.event_time || '00:00';
      
      if (!eventStartDateStr) return true; // Include events without dates to be safe
      
      try {
        // Create the exact start datetime of the event
        const eventStartDateTime = new Date(eventStartDateStr + ' ' + eventTimeStr);
        
        // Event is upcoming if its start time is in the future
        const isUpcoming = eventStartDateTime > now;
        
        if (!isUpcoming) {
          console.log(`🚫 Event "${event.event_name}" has started at ${eventStartDateTime.toLocaleString()}, removing from display`);
        }
        
        return isUpcoming;
      } catch (error) {
        console.warn('Error parsing event date/time:', error, event);
        return true; // Include events with parsing errors to be safe
      }
    });
  }

  // Get display images for events conducted card
  getEventsDisplayImages(): string[] {
    const selectedImages = [
      'assets/images/Event-Images/istockphoto-1166978137-612x612.jpg',
      'assets/images/Event-Images/istockphoto-1349104991-612x612.jpg',
      'assets/images/Event-Images/istockphoto-1371940128-612x612.jpg',
      'assets/images/Event-Images/istockphoto-2189800011-612x612.jpg'
    ];
    return selectedImages;
  }

  // Load completed events count
  private loadCompletedEventsCount(): void {
    // Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // First, let's get all events and count completed ones on frontend side
    this.eventService.getAllEvents().subscribe({
      next: (allEvents: Event[]) => {
        console.log('🔍 All events from database:', allEvents);
        
        // Count completed events (where end date is before today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedCount = allEvents.filter(event => {
          if (!event.event_end_date) return false;
          const eventEndDate = new Date(event.event_end_date);
          eventEndDate.setHours(0, 0, 0, 0);
          return eventEndDate < today;
        }).length;
        
        this.completedEventsCount = completedCount;
        console.log(`✅ Calculated completed events count: ${completedCount} out of ${allEvents.length} total events`);
        
        // Force change detection
        this.cdr.detectChanges();
        
        // Fallback to dedicated endpoint if available
        this.eventService.getCompletedEventsCount().subscribe({
          next: (count: number) => {
            this.completedEventsCount = count;
            console.log('✅ Backend completed events count:', count);
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.log('⚠️ Backend endpoint not available, using calculated count:', this.completedEventsCount);
          }
        });
      },
      error: (error) => {
        console.error('Error fetching all events:', error);
        // Ultimate fallback
        this.completedEventsCount = 0;
      }
    });
  }
}
