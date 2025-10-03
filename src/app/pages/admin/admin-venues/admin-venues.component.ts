import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Venue {
  venue_id?: number;
  name: string;
  floor: number;
}

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-venues.component.html',
  styleUrl: './admin-venues.component.scss'
})
export class AdminVenuesComponent implements OnInit {
  venues: Venue[] = [];
  filteredVenues: Venue[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  venueForm: FormGroup;
  loading = false;
  error = '';
  
  selectedVenueId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.venueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      floor: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    this.loadVenues();
  }

  async loadVenues() {
    try {
      this.venues = await this.http.get<Venue[]>(`${this.apiUrl}/venues`).toPromise() || [];
      this.filteredVenues = [...this.venues];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading venues:', error);
      this.showErrorMessage('Failed to load venues');
    }
  }

  filterVenues() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredVenues = [...this.venues];
      return;
    }

    this.filteredVenues = this.venues.filter(venue =>
      venue.name?.toLowerCase().includes(term) ||
      venue.floor?.toString().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterVenues();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.venueForm.reset();
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.venueForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.venueForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.venueForm.value;
      const venueData = {
        name: formValue.name,
        floor: parseInt(formValue.floor)
      };
      
      await this.http.post<Venue>(`${this.apiUrl}/venues`, venueData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Venue created successfully!');
      await this.loadVenues();
    } catch (error: any) {
      console.error('Error creating venue:', error);
      this.error = error?.error?.message || 'Failed to create venue. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(venueId: number) {
    this.selectedVenueId = venueId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedVenueId = null;
  }

  async confirmDelete() {
    if (!this.selectedVenueId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting venue with ID:', this.selectedVenueId);
      
      await this.http.delete(`${this.apiUrl}/venues/${this.selectedVenueId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      await this.loadVenues();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedVenueId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Venue deleted successfully!';
      this.showSuccessToast = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting venue:', error);
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedVenueId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage(`Failed to delete venue.`);
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
