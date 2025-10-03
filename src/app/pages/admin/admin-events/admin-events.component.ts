import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Event {
  event_id?: number;
  event_name: string;
  event_start_date: string;
  event_end_date: string;
  event_time: string;
  event_type: string;
  event_description: string;
  judge_id: number | null;
  club_id: number | null;
  venue_id: number | null;
  venue?: { venue_id: number; name: string; floor: number };
  club?: { club_id: number; name: string };
  judge?: { judge_id: number; judge_name: string };
}

interface Venue {
  venue_id: number;
  name: string;
  floor: number;
}

interface Club {
  club_id: number;
  name: string;
}

interface Judge {
  judge_id: number;
  judge_name: string;
}

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-events.component.html',
  styleUrl: './admin-events.component.scss'
})
export class AdminEventsComponent implements OnInit {
  events: Event[] = [];
  venues: Venue[] = [];
  clubs: Club[] = [];
  judges: Judge[] = [];
  filteredEvents: Event[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  eventForm: FormGroup;
  loading = false; // Start with false - no lazy loading
  error = '';
  
  selectedEventId: number | null = null;
  minDate: string = '';
  
  private apiUrl = 'http://localhost:8080/api';  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize form with validators
    this.eventForm = this.fb.group({
      event_name: ['', [Validators.required, Validators.minLength(3)]],
      event_start_date: ['', Validators.required],
      event_end_date: ['', Validators.required],
      event_time: ['', Validators.required],
      event_type: ['', Validators.required],
      event_description: ['', [Validators.required, Validators.minLength(10)]],
      judge_id: [null],
      club_id: [null],
      venue_id: [null]
    });
  }

  ngOnInit() {
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.minDate = tomorrow.toISOString().split('T')[0];
    
    this.loadAllData();
  }

  async loadAllData() {
    // Load data silently in background - no loading spinner
    try {
      await Promise.all([
        this.loadEvents(),
        this.loadVenues(),
        this.loadClubs(),
        this.loadJudges()
      ]);
      
      // Force change detection to update UI immediately
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading data:', error);
      // Silent failure - data loads in background
      this.cdr.detectChanges();
    }
  }

  async loadEvents() {
    try {
      this.events = await this.http.get<Event[]>(`${this.apiUrl}/events`).toPromise() || [];
      this.filteredEvents = [...this.events]; // Initialize filtered list
      this.cdr.detectChanges(); // Trigger UI update
    } catch (error) {
      console.error('Error loading events:', error);
      throw error;
    }
  }

  async loadVenues() {
    try {
      this.venues = await this.http.get<Venue[]>(`${this.apiUrl}/venues`).toPromise() || [];
    } catch (error) {
      console.error('Error loading venues:', error);
      // Don't throw - venues are optional
    }
  }

  async loadClubs() {
    try {
      this.clubs = await this.http.get<Club[]>(`${this.apiUrl}/clubs`).toPromise() || [];
    } catch (error) {
      console.error('Error loading clubs:', error);
      // Don't throw - clubs are optional
    }
  }

  async loadJudges() {
    try {
      this.judges = await this.http.get<Judge[]>(`${this.apiUrl}/judges`).toPromise() || [];
    } catch (error) {
      console.error('Error loading judges:', error);
      // Don't throw - judges are optional
    }
  }

  get totalEvents(): number {
    return this.events.length;
  }

  get upcomingEvents(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.events.filter(e => e.event_start_date >= today).length;
  }

  get completedEvents(): number {
    const today = new Date().toISOString().split('T')[0];
    return this.events.filter(e => e.event_end_date < today).length;
  }

  openCreateModal() {
    this.eventForm.reset();
    this.showCreateModal = true;
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.eventForm.reset();
    this.error = '';
  }

  onStartDateChange() {
    const startDate = this.eventForm.get('event_start_date')?.value;
    if (startDate) {
      // Set end date minimum to start date
      this.eventForm.get('event_end_date')?.setValidators([
        Validators.required
      ]);
      this.eventForm.get('event_end_date')?.updateValueAndValidity();
    }
  }

  validateDates(): boolean {
    const startDate = this.eventForm.get('event_start_date')?.value;
    const endDate = this.eventForm.get('event_end_date')?.value;
    
    if (!startDate || !endDate) {
      return false;
    }
    
    // Check if start date is tomorrow or later
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    if (start < tomorrow) {
      this.error = 'Start date must be tomorrow or later';
      return false;
    }
    
    // Check if end date is >= start date
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    if (end < start) {
      this.error = 'End date must be on or after start date';
      return false;
    }
    
    return true;
  }

  async submitEvent() {
    if (this.eventForm.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }
    
    if (!this.validateDates()) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    try {
      const formValue = this.eventForm.value;
      
      // Create event object with proper null handling
      const eventData: any = {
        event_name: formValue.event_name,
        event_start_date: formValue.event_start_date,
        event_end_date: formValue.event_end_date,
        event_time: formValue.event_time,
        event_type: formValue.event_type,
        event_description: formValue.event_description
      };
      
      // Only include IDs if they have values
      if (formValue.judge_id) eventData.judge_id = parseInt(formValue.judge_id);
      if (formValue.club_id) eventData.club_id = parseInt(formValue.club_id);
      if (formValue.venue_id) eventData.venue_id = parseInt(formValue.venue_id);
      
      await this.http.post<Event>(`${this.apiUrl}/events`, eventData).toPromise();
      
      // Close modal
      this.closeCreateModal();
      
      // Show success toast
      this.showSuccessMessage('Event created successfully!');
      
      // Reload events
      await this.loadEvents();
    } catch (error: any) {
      console.error('Error creating event:', error);
      this.error = error?.error?.message || 'Failed to create event. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(eventId: number) {
    this.selectedEventId = eventId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedEventId = null;
  }

  async confirmDelete() {
    if (!this.selectedEventId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges(); // Force update to show "Deleting..."
    
    try {
      // Delete event via API - DON'T CHANGE THIS LOGIC
      console.log('Deleting event with ID:', this.selectedEventId);
      console.log('DELETE URL:', `${this.apiUrl}/events/${this.selectedEventId}`);
      
      await this.http.delete(`${this.apiUrl}/events/${this.selectedEventId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      // Reload events immediately
      await this.loadEvents();
      
      // Wait 3 seconds while showing "Deleting..." message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now close the modal
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedEventId = null;
      this.cdr.detectChanges(); // Force modal to close
      
      // Wait for modal animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show success toast for 3 seconds
      console.log('About to show toast...');
      this.toastMessage = 'Event deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges(); // Force toast to show
      console.log('Change detection triggered for toast');
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges(); // Force toast to hide
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting event:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error URL:', error.url);
      
      // Reset loading state
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedEventId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage(`Failed to delete event. Server might not be running or event doesn't exist.`);
    }
  }

  showSuccessMessage(message: string): void {
    this.toastMessage = message;
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
    }, 3000); // Auto-hide after 10 seconds
  }

  showErrorMessage(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    setTimeout(() => {
      this.showErrorToast = false;
    }, 3000);
  }

  getVenueName(venueId: number | null): string {
    if (!venueId) return 'N/A';
    const venue = this.venues.find(v => v.venue_id === venueId);
    return venue ? `${venue.name} (Floor ${venue.floor})` : 'N/A';
  }

  getClubName(clubId: number | null): string {
    if (!clubId) return 'N/A';
    const club = this.clubs.find(c => c.club_id === clubId);
    return club ? club.name : 'N/A';
  }

  getJudgeName(judgeId: number | null): string {
    if (!judgeId) return 'N/A';
    const judge = this.judges.find(j => j.judge_id === judgeId);
    return judge ? judge.judge_name : 'N/A';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredEvents = [...this.events];
      return;
    }

    this.filteredEvents = this.events.filter(event => 
      event.event_name.toLowerCase().includes(term) ||
      event.event_type.toLowerCase().includes(term) ||
      event.event_description.toLowerCase().includes(term) ||
      this.getVenueName(event.venue_id).toLowerCase().includes(term) ||
      this.getClubName(event.club_id).toLowerCase().includes(term) ||
      this.getJudgeName(event.judge_id).toLowerCase().includes(term)
    );
  }
}
