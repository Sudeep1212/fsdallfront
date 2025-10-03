import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { RegistrationService, RegistrationRequest, RegistrationResponse, ParticipationRequest, ParticipationResponse } from '../../services/registration.service';
import { PdfService, TicketData } from '../../services/pdf.service';
import { Event } from '../../models/event.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-event-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './event-registration.component.html',
  styleUrls: ['./event-registration.component.scss']
})
export class EventRegistrationComponent implements OnInit, OnDestroy {
  event: Event | null = null;
  currentUser: User | null = null;
  eventFee: number = 0;
  registrationForm: FormGroup;
  isModalOpen = false;
  isLoading = false;
  isRegistering = false;
  showSuccess = false;
  participantId: string | null = null;
  errorMessage = '';
  
  private subscriptions: Subscription[] = [];
  
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
    'assets/images/Event-Images/istockphoto-2189800011-612x612.jpg'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private authService: AuthService,
    private registrationService: RegistrationService,
    private pdfService: PdfService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.registrationForm = this.fb.group({
      name: ['', [Validators.required]],
      college: ['', [Validators.required]],
      contact: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]{10,}$/)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.getCurrentUser() as User;
    
    // Get event ID from route
    const eventId = this.route.snapshot.params['id'];
    if (eventId) {
      this.loadEventDetails(eventId);
    }

    // Pre-fill form if user is logged in
    if (this.currentUser) {
      this.prefillForm();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadEventDetails(eventId: number): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Load event details
    const eventSub = this.eventService.getEventById(eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loadEventFee(eventId); // Load fee after event is loaded
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/']);
      }
    });
    this.subscriptions.push(eventSub);
  }

  private loadEventFee(eventId: number): void {
    console.log('Loading fee for event ID:', eventId);
    const feeSub = this.registrationService.getEventFee(eventId).subscribe({
      next: (fee) => {
        console.log('Received fee from backend:', fee);
        this.eventFee = fee;
        console.log('Set eventFee to:', this.eventFee);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading event fee:', error);
        // Fallback to hardcoded fee calculation if backend fails
        this.eventFee = this.getEventFee();
        console.log('Fallback fee set to:', this.eventFee);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(feeSub);
  }

  private prefillForm(): void {
    if (this.currentUser) {
      this.registrationForm.patchValue({
        name: `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim(),
        college: this.currentUser.college || '',
        contact: this.currentUser.contact || '',
        email: this.currentUser.email || ''
      });
    }
  }

  openRegistrationModal(): void {
    if (!this.authService.isLoggedIn()) {
      // Redirect to login with return URL
      this.router.navigate(['/'], { 
        queryParams: { 
          returnUrl: this.router.url,
          showLogin: 'true',
          feature: 'registration'
        } 
      });
      return;
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.errorMessage = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '';
    try {
      // Check if the time already has AM/PM
      if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        return timeStr; // Return as-is if already formatted
      }
      
      // Handle 24-hour format conversion
      let time = timeStr.trim();
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      }
      return time;
    } catch {
      return timeStr;
    }
  }

  formatEventFee(amount?: number): string {
    if (!amount || amount === 0) return 'FREE';
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  getEventFee(): number {
    if (!this.event) return 0;
    
    // Calculate fee based on event type
    const feeStructure: { [key: string]: number } = {
      'Technical': 500,
      'Cultural': 300,
      'Sports': 400,
      'Workshop': 250,
      'Conference': 750,
      'Competition': 600,
      'default': 350
    };
    
    return feeStructure[this.event.event_type] || feeStructure['default'];
  }

  onSubmitRegistration(): void {
    if (this.registrationForm.invalid || !this.event) {
      this.markFormGroupTouched(this.registrationForm);
      return;
    }

    this.isRegistering = true;
    this.errorMessage = '';

    const registrationData: RegistrationRequest = this.registrationForm.value;

    // First create registration
    const regSub = this.registrationService.createRegistration(registrationData)
      .subscribe({
        next: (registration: RegistrationResponse) => {
          // Then create participation
          const participationData: ParticipationRequest = {
            registration: registration,
            event: this.event!,
            eventAmount: this.eventFee
          };

          const partSub = this.registrationService.createParticipation(participationData)
            .subscribe({
              next: (participation: ParticipationResponse) => {
                this.participantId = this.registrationService.generateParticipantId(participation.participationId);
                this.isRegistering = false;
                this.isModalOpen = false;
                this.showSuccess = true;
                this.cdr.detectChanges();
              },
              error: (error: any) => {
                console.error('Error creating participation:', error);
                this.errorMessage = 'Failed to complete registration. Please try again.';
                this.isRegistering = false;
                this.cdr.detectChanges();
              }
            });
          this.subscriptions.push(partSub);
        },
        error: (error: any) => {
          console.error('Error creating registration:', error);
          this.errorMessage = 'Failed to create registration. Please try again.';
          this.isRegistering = false;
          this.cdr.detectChanges();
        }
      });
    this.subscriptions.push(regSub);
  }

  downloadTicket(): void {
    if (!this.participantId || !this.event) return;

    const registrationData = this.registrationForm.value;
    const ticketData: TicketData = {
      participantId: this.participantId,
      participantName: registrationData.name,
      college: registrationData.college,
      contact: registrationData.contact,
      email: registrationData.email,
      eventName: this.event.event_name,
      eventDate: this.formatDate(this.event.event_start_date),
      eventTime: this.formatTime(this.event.event_time || ''),
      venue: this.event.venue?.name || 'TBD',
      clubName: this.event.club?.name || 'Event Organizer',
      eventFee: this.formatEventFee(this.eventFee)
    };

    this.pdfService.generateTicketPDF(ticketData);
  }

  backToHome(): void {
    this.router.navigate(['/']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registrationForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} is required`;
      if (control.errors['email']) return 'Please enter a valid email';
      if (control.errors['pattern']) return 'Please enter a valid contact number';
    }
    return '';
  }

  getEventImage(eventId: number): string {
    // Use event ID to ensure consistent image assignment (same as home component)
    const imageIndex = (eventId - 1) % this.eventImages.length;
    return this.eventImages[imageIndex];
  }

}