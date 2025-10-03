import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Result {
  resultId?: number;
  rank: number;
  score: number;
  eventId: number | null;
  eventName?: string;
  participationId: number | null;
  participantName?: string;
  participantCollege?: string;
}

interface Event {
  event_id: number;
  event_name: string;
}

interface Participation {
  participationId: number;
  eventAmount: number;
  registrationId: number;
  participantName: string;
  participantCollege: string;
  eventId: number;
  eventName: string;
}

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-results.component.html',
  styleUrl: './admin-results.component.scss'
})
export class AdminResultsComponent implements OnInit {
  results: Result[] = [];
  events: Event[] = [];
  participations: Participation[] = [];
  filteredResults: Result[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  resultForm: FormGroup;
  loading = false;
  error = '';
  
  selectedResultId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.resultForm = this.fb.group({
      rank: ['', [Validators.required, Validators.min(1)]],
      score: ['', [Validators.required, Validators.min(0)]],
      eventId: [null, Validators.required],
      participationId: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadResults();
    this.loadEvents();
    this.loadParticipations();
  }

  async loadResults() {
    try {
      this.results = await this.http.get<Result[]>(`${this.apiUrl}/results`).toPromise() || [];
      this.filteredResults = [...this.results];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading results:', error);
      this.showErrorMessage('Failed to load results');
    }
  }

  async loadEvents() {
    try {
      this.events = await this.http.get<Event[]>(`${this.apiUrl}/events`).toPromise() || [];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async loadParticipations() {
    try {
      this.participations = await this.http.get<Participation[]>(`${this.apiUrl}/participations`).toPromise() || [];
      console.log('Loaded participations:', this.participations);
      console.log('Participations count:', this.participations.length);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading participations:', error);
    }
  }

  filterResults() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredResults = [...this.results];
      return;
    }

    this.filteredResults = this.results.filter(result =>
      result.participantName?.toLowerCase().includes(term) ||
      result.eventName?.toLowerCase().includes(term) ||
      result.participantCollege?.toLowerCase().includes(term) ||
      result.rank.toString().includes(term) ||
      result.score.toString().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterResults();
  }

  get totalResults(): number {
    return this.results.length;
  }

  get activeResults(): number {
    return this.results.filter(r => r.rank <= 3).length; // Count top 3 positions
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.resultForm.reset();
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.resultForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.resultForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.resultForm.value;
      
      // Find the selected event and participation
      const selectedEvent = this.events.find(e => e.event_id === parseInt(formValue.eventId));
      const selectedParticipation = this.participations.find(p => p.participationId === parseInt(formValue.participationId));
      
      const resultData = {
        rank: parseInt(formValue.rank),
        score: parseFloat(formValue.score),
        event: { event_id: formValue.eventId },
        participation: { participationId: formValue.participationId }
      };
      
      await this.http.post<Result>(`${this.apiUrl}/results`, resultData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Result created successfully!');
      await this.loadResults();
    } catch (error: any) {
      console.error('Error creating result:', error);
      this.error = error?.error?.message || 'Failed to create result. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(resultId: number) {
    this.selectedResultId = resultId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedResultId = null;
  }

  async confirmDelete() {
    if (!this.selectedResultId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting result with ID:', this.selectedResultId);
      
      await this.http.delete(`${this.apiUrl}/results/${this.selectedResultId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      // Reload results immediately
      await this.loadResults();
      
      // Wait 3 seconds while showing "Deleting..." message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now close the modal
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedResultId = null;
      this.cdr.detectChanges();
      
      // Wait for modal animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show success toast for 3 seconds
      this.toastMessage = 'Result deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting result:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedResultId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete result.');
    }
  }

  showSuccessMessage(message: string): void {
    this.toastMessage = message;
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
    }, 3000);
  }

  showErrorMessage(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    setTimeout(() => {
      this.showErrorToast = false;
    }, 3000);
  }
}
