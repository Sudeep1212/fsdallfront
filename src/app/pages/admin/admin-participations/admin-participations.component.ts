import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Participation {
  participationId: number;
  eventAmount: number;
  registrationId?: number;
  participantName?: string;
  participantCollege?: string;
  eventId?: number;
  eventName?: string;
}

@Component({
  selector: 'app-admin-participations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-participations.component.html',
  styleUrl: './admin-participations.component.scss'
})
export class AdminParticipationsComponent implements OnInit {
  participations: Participation[] = [];
  filteredParticipations: Participation[] = [];
  searchTerm: string = '';
  
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  loading = false;
  
  selectedParticipationId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadParticipations();
  }

  async loadParticipations() {
    try {
      this.participations = await this.http.get<Participation[]>(`${this.apiUrl}/participations`).toPromise() || [];
      this.filteredParticipations = [...this.participations];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading participations:', error);
      this.showErrorMessage('Failed to load participations');
    }
  }

  filterParticipations() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredParticipations = [...this.participations];
      return;
    }

    this.filteredParticipations = this.participations.filter(p =>
      p.participantName?.toLowerCase().includes(term) ||
      p.participantCollege?.toLowerCase().includes(term) ||
      p.eventName?.toLowerCase().includes(term) ||
      p.eventAmount.toString().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterParticipations();
  }

  get totalParticipations(): number {
    return this.participations.length;
  }

  get activeParticipations(): number {
    return this.filteredParticipations.length;
  }

  openDeleteModal(participationId: number) {
    this.selectedParticipationId = participationId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedParticipationId = null;
  }

  async confirmDelete() {
    if (!this.selectedParticipationId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      await this.http.delete(`${this.apiUrl}/participations/${this.selectedParticipationId}`, { responseType: 'text' }).toPromise();
      
      await this.loadParticipations();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedParticipationId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Participation deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting participation:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedParticipationId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete participation.');
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
