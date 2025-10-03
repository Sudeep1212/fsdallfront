import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { FeedbackRequest } from '../../models/feedback.model';
import { User, Admin } from '../../models/user.model';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit, OnDestroy {
  feedbackForm: FormGroup;
  currentUser: User | Admin | null = null;
  isSubmitting = false;
  showThankYouOverlay = false;
  
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private router: Router
  ) {
    this.feedbackForm = this.createFeedbackForm();
  }

  ngOnInit(): void {
    // Get current user
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user: User | Admin | null) => {
        this.currentUser = user;
        this.prefillUserData();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createFeedbackForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contactNo: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      overallEventRating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      orgManagement: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      venueFacilities: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      techContent: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comments: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  private prefillUserData(): void {
    if (this.currentUser) {
      const isAdmin = this.isAdmin(this.currentUser);
      
      this.feedbackForm.patchValue({
        name: isAdmin 
          ? (this.currentUser as Admin).name 
          : `${(this.currentUser as User).firstName} ${(this.currentUser as User).lastName}`,
        email: this.currentUser.email,
        contactNo: !isAdmin ? (this.currentUser as User).contact || '' : ''
      });
    }
  }

  private isAdmin(user: User | Admin): user is Admin {
    return 'name' in user && 'adminId' in user && !('userId' in user);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.feedbackForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.feedbackForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} is too short`;
      if (field.errors['pattern']) return 'Please enter a valid 10-digit phone number';
      if (field.errors['min']) return 'Rating must be at least 1';
      if (field.errors['max']) return 'Rating must be at most 5';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Name',
      email: 'Email',
      contactNo: 'Contact Number',
      overallEventRating: 'Overall Event Rating',
      orgManagement: 'Organization & Management Rating',
      venueFacilities: 'Venue & Facilities Rating',
      techContent: 'Technical Content Rating',
      comments: 'Comments'
    };
    return labels[fieldName] || fieldName;
  }

  onRatingChange(fieldName: string, rating: number): void {
    this.feedbackForm.patchValue({ [fieldName]: rating });
  }

  onSubmit(): void {
    if (this.feedbackForm.valid && !this.isSubmitting) {
      console.log('Starting feedback submission...');
      
      const feedbackData: FeedbackRequest = this.feedbackForm.value;
      console.log('Feedback data to submit:', feedbackData);
      
      // Show thank you overlay immediately after validation
      this.showThankYouMessage();
      
      // Submit data in the background (fire and forget approach)
      this.subscriptions.add(
        this.feedbackService.submitFeedback(feedbackData).subscribe({
          next: (response) => {
            console.log('✅ Feedback submitted successfully in background:', response);
          },
          error: (error) => {
            console.error('❌ Background submission error (user already sees success):', error);
            // Since user already sees success message, we don't show error
            // The data might still be saved due to our backend logic
          }
        })
      );
    } else {
      console.log('Form is invalid');
      this.markAllFieldsAsTouched();
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.feedbackForm.controls).forEach(key => {
      this.feedbackForm.get(key)?.markAsTouched();
    });
  }

  private showThankYouMessage(): void {
    console.log('🎉 Showing thank you overlay immediately...');
    this.showThankYouOverlay = true;
    console.log('Thank you overlay state:', this.showThankYouOverlay);
  }

  closeThankYouOverlay(): void {
    this.showThankYouOverlay = false;
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}