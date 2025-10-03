import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventService } from '../../services/event.service';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Event } from '../../models/event.model';
import { User, Admin } from '../../models/user.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
  dayNumber: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  // Current state
  currentDate = new Date();
  currentMonth = new Date();
  currentUser: User | Admin | null = null;
  isDarkMode = false;
  
  // Calendar data
  calendarDays: CalendarDay[] = [];
  miniCalendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;
  selectedDateEvents: Event[] = [];
  allEvents: Event[] = []; // All events from database
  upcomingEvents: Event[] = [];
  sidebarUpcomingEvents: Event[] = [];
  
  // Loading and error states
  isLoading = true;
  hasError = false;
  errorMessage = '';
  
  // UI state
  isAnimating = false;
  
  private subscriptions = new Subscription();
  
  // Event type colors
  private eventTypeColors: { [key: string]: string } = {
    'Technical': '#3A72EC',
    'Cultural': '#ec4899',
    'Sports': '#10b981',
    'Workshop': '#f59e0b',
    'Competition': '#ef4444',
    'Seminar': '#8b5cf6',
    'Conference': '#06b6d4',
    'Festival': '#f97316',
    'default': '#6b7280'
  };
  
  // Month names
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Day names
  readonly dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private eventService: EventService,
    private themeService: ThemeService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Initialize current date immediately (no loading delay)
    this.currentDate = new Date();
    this.currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    this.selectedDate = new Date(this.currentDate);
    
    // Set initial loading state to false - we'll show calendar immediately
    this.isLoading = false;
    
    // Generate empty calendar first for immediate display
    this.generateCalendar();
    this.cdr.detectChanges(); // Trigger change detection immediately
    
    // Subscribe to theme changes
    this.subscriptions.add(
      this.themeService.isDarkMode$.subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
        this.cdr.detectChanges();
      })
    );
    
    // Subscribe to current user
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user: User | Admin | null) => {
        this.currentUser = user;
        this.cdr.detectChanges();
      })
    );
    
    // Load data asynchronously after initial render
    setTimeout(() => {
      this.loadCalendarData();
    }, 0);
    
    // Auto-refresh every 5 minutes
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.loadCalendarData();
      }, 300000); // 5 minutes
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load all events from backend with optimized loading
   */
  private loadCalendarData(): void {
    // Don't show loading for data refresh - calendar is already visible
    this.hasError = false;
    
    this.subscriptions.add(
      this.eventService.getAllEvents().subscribe({
        next: (events: Event[]) => {
          console.log('📅 Calendar: Events loaded from backend:', events.length);
          this.processEvents(events);
          this.generateCalendar();
          this.updateSelectedDateEvents();
          this.updateUpcomingEvents();
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after data load
          console.log('✅ Calendar: Data loaded and change detection triggered');
        },
        error: (error) => {
          console.error('Failed to load events:', error);
          this.hasError = true;
          this.errorMessage = 'Unable to load events. Please check your connection and try again.';
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection on error
          
          // Load fallback mock data for demo
          this.loadFallbackData();
        }
      })
    );
  }
  
  /**
   * Process events and add color coding (include past events)
   */
  private processEvents(events: Event[]): void {
    // Store all events from database
    this.allEvents = events;
    // Keep upcomingEvents for backward compatibility
    this.upcomingEvents = events;
  }
  

  
  /**
   * Format event time for display
   */
  formatEventTime(time: string): string {
    if (!time) return '';
    
    try {
      // Check if time already contains AM/PM
      if (time.includes('AM') || time.includes('PM') || time.includes('am') || time.includes('pm')) {
        return time; // Return as-is if already formatted
      }
      
      // Assume time is in HH:mm:ss format
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const minute = minutes || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      
      return `${displayHour}:${minute} ${ampm}`;
    } catch (error) {
      return time;
    }
  }
  
  /**
   * Generate calendar grid for current month
   */
  private generateCalendar(): void {
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    
    // Move to the start of the week
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === this.currentMonth.getMonth();
      const isToday = this.isSameDay(currentDate, today);
      const dayEvents = this.getEventsForDate(currentDate);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        events: dayEvents,
        dayNumber: currentDate.getDate()
      });
    }
    
    this.calendarDays = days;
    this.generateMiniCalendar();
  }
  
  /**
   * Generate mini calendar for sidebar
   */
  private generateMiniCalendar(): void {
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    const startDate = new Date(firstDay);
    
    // Move to the start of the week
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Generate 42 days (6 weeks) for mini calendar
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = currentDate.getMonth() === this.currentMonth.getMonth();
      const isToday = this.isSameDay(currentDate, today);
      const dayEvents = this.getEventsForDate(currentDate);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isToday,
        events: dayEvents,
        dayNumber: currentDate.getDate()
      });
    }
    
    this.miniCalendarDays = days;
  }
  
  /**
   * Get events for a specific date (includes multi-day events and past events)
   */
  private getEventsForDate(date: Date): Event[] {
    return this.allEvents.filter(event => {
      if (!event.event_start_date) return false;
      
      try {
        // Parse backend date format (YYYY-MM-DD)
        const eventStartDate = new Date(event.event_start_date);
        const eventEndDate = event.event_end_date ? new Date(event.event_end_date) : eventStartDate;
        
        // Normalize dates to compare just the date part (ignore time)
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const startDate = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
        const endDate = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
        
        // Check if the date falls within the event's duration
        return targetDate >= startDate && targetDate <= endDate;
      } catch (error) {
        return false;
      }
    });
  }
  
  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  /**
   * Navigate to previous month
   */
  previousMonth(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
    this.generateCalendar();
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.isAnimating = false;
      this.cdr.detectChanges();
    }, 300);
  }
  
  /**
   * Navigate to next month
   */
  nextMonth(): void {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
    this.generateCalendar();
    this.cdr.detectChanges();
    
    setTimeout(() => {
      this.isAnimating = false;
      this.cdr.detectChanges();
    }, 300);
  }
  
  /**
   * Go to current month
   */
  goToToday(): void {
    if (this.isAnimating) return;
    
    const today = new Date();
    this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDate = new Date(today);
    this.generateCalendar();
    this.updateSelectedDateEvents();
    this.cdr.detectChanges();
  }
  
  /**
   * Select a date
   */
  selectDate(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    
    this.selectedDate = new Date(day.date);
    this.updateSelectedDateEvents();
    this.cdr.detectChanges();
  }
  
  /**
   * Update events for selected date
   */
  private updateSelectedDateEvents(): void {
    if (!this.selectedDate) {
      this.selectedDateEvents = [];
      return;
    }
    
    this.selectedDateEvents = this.getEventsForDate(this.selectedDate);
    this.cdr.detectChanges();
  }
  
  /**
   * Update upcoming events (next 30 days) for sidebar display
   */
  private updateUpcomingEvents(): void {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    // Keep all events for calendar display but create filtered list for sidebar
    const allEvents = [...this.upcomingEvents];
    
    // Filter and sort upcoming events for sidebar
    const upcoming = allEvents.filter(event => {
      if (!event.event_start_date) return false;
      
      try {
        const eventDate = new Date(event.event_start_date);
        return eventDate >= today && eventDate <= thirtyDaysLater;
      } catch (error) {
        return false;
      }
    });
    
    // Sort by date and time
    upcoming.sort((a, b) => {
      const dateA = new Date(a.event_start_date || '');
      const dateB = new Date(b.event_start_date || '');
      return dateA.getTime() - dateB.getTime();
    });
    
    // Keep separate arrays for all events and upcoming sidebar events
    this.sidebarUpcomingEvents = upcoming.slice(0, 10); // Limit to 10 events for sidebar
    this.cdr.detectChanges();
  }
  
  /**
   * Get formatted month and year
   */
  getCurrentMonthYear(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }
  
  /**
   * Get formatted selected date
   */
  getSelectedDateFormatted(): string {
    if (!this.selectedDate) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return this.selectedDate.toLocaleDateString('en-US', options);
  }

  getCurrentDateFormatted(): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return this.currentDate.toLocaleDateString('en-US', options);
  }
  
  /**
   * Check if date is selected
   */
  isSelectedDate(day: CalendarDay): boolean {
    if (!this.selectedDate) return false;
    return this.isSameDay(day.date, this.selectedDate);
  }
  
  /**
   * Retry loading data
   */
  retryLoad(): void {
    this.loadCalendarData();
  }
  
  /**
   * Load fallback mock data for demo purposes
   */
  private loadFallbackData(): void {
    const mockEvents: Event[] = [
      {
        event_id: 1,
        event_name: 'Tech Symposium 2025',
        event_description: 'Annual technology conference featuring latest innovations',
        event_start_date: '2025-10-15',
        event_end_date: '2025-10-15',
        event_time: '09:00:00',
        event_type: 'Technical',
        venue_id: 1,
        club_id: 1,
        judge_id: 1
      },
      {
        event_id: 2,
        event_name: 'Cultural Night',
        event_description: 'Celebrate diversity through music, dance, and art',
        event_start_date: '2025-10-20',
        event_end_date: '2025-10-20',
        event_time: '18:00:00',
        event_type: 'Cultural',
        venue_id: 2,
        club_id: 2,
        judge_id: 2
      },
      {
        event_id: 3,
        event_name: 'Sports Championship',
        event_description: 'Inter-college sports competition',
        event_start_date: '2025-10-25',
        event_end_date: '2025-10-27',
        event_time: '08:00:00',
        event_type: 'Sports',
        venue_id: 3,
        club_id: 3,
        judge_id: 3
      }
    ];
    
    this.processEvents(mockEvents);
    this.generateCalendar();
    this.updateSelectedDateEvents();
    this.updateUpcomingEvents();
  }
  
  /**
   * Format event date for sidebar display
   */
  formatEventDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateStr;
    }
  }
  
  /**
   * Get event type badge class
   */
  getEventTypeBadge(eventType: string): string {
    const type = (eventType || 'default').toLowerCase();
    return `event-badge event-badge-${type}`;
  }
  
  /**
   * TrackBy function for calendar days
   */
  trackByDate(index: number, day: CalendarDay): string {
    return `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;
  }
  
  /**
   * Select event date from sidebar
   */
  selectEventDate(dateString: string): void {
    try {
      const date = new Date(dateString);
      this.selectedDate = date;
      this.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      this.generateCalendar();
      this.updateSelectedDateEvents();
    } catch (error) {
      console.error('Invalid date format:', dateString);
    }
  }
  
  /**
   * Get color for event type (public method for template)
   */
  getEventColor(eventType: string): string {
    return this.eventTypeColors[eventType] || this.eventTypeColors['default'];
  }
  
  /**
   * Check if a date is in the past
   */
  isPastDate(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  /**
   * Get the primary event type for a day (for background coloring)
   */
  getPrimaryEventType(events: Event[]): string {
    if (events.length === 0) return 'default';
    
    // If only one event, return its type
    if (events.length === 1) {
      return events[0].event_type || 'default';
    }
    
    // For multiple events, prioritize by importance order
    const priorityOrder = ['Competition', 'Conference', 'Technical', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Festival'];
    
    for (const priority of priorityOrder) {
      const foundEvent = events.find(event => event.event_type === priority);
      if (foundEvent) return priority;
    }
    
    // Fallback to first event's type
    return events[0].event_type || 'default';
  }

  /**
   * Get background color for a day based on its events
   */
  getDayBackgroundColor(events: Event[]): string {
    if (events.length === 0) return '';
    
    const primaryType = this.getPrimaryEventType(events);
    const color = this.getEventColor(primaryType);
    
    // Return rgba with low opacity for background
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }

  /**
   * Get border color for a day based on its events
   */
  getDayBorderColor(events: Event[]): string {
    if (events.length === 0) return '';
    
    const primaryType = this.getPrimaryEventType(events);
    return this.getEventColor(primaryType);
  }
}