import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Club {
  club_id?: number;
  name: string;
  presidentName: string;
  presidentContact: string;
  presidentEmail: string;
}

@Component({
  selector: 'app-admin-clubs',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-clubs.component.html',
  styleUrl: './admin-clubs.component.scss'
})
export class AdminClubsComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  clubForm: FormGroup;
  loading = false;
  error = '';
  
  selectedClubId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.clubForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      presidentName: ['', [Validators.required, Validators.minLength(3)]],
      presidentContact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      presidentEmail: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadClubs();
  }

  async loadClubs() {
    try {
      this.clubs = await this.http.get<Club[]>(`${this.apiUrl}/clubs`).toPromise() || [];
      this.filteredClubs = [...this.clubs];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading clubs:', error);
      this.showErrorMessage('Failed to load clubs');
    }
  }

  filterClubs() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredClubs = [...this.clubs];
      return;
    }

    this.filteredClubs = this.clubs.filter(club =>
      club.name?.toLowerCase().includes(term) ||
      club.presidentName?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterClubs();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.clubForm.reset();
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.clubForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.clubForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.clubForm.value;
      const clubData = {
        name: formValue.name,
        presidentName: formValue.presidentName,
        presidentContact: formValue.presidentContact,
        presidentEmail: formValue.presidentEmail
      };
      
      await this.http.post<Club>(`${this.apiUrl}/clubs`, clubData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Club created successfully!');
      await this.loadClubs();
    } catch (error: any) {
      console.error('Error creating club:', error);
      this.error = error?.error?.message || 'Failed to create club. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(clubId: number) {
    this.selectedClubId = clubId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedClubId = null;
  }

  async confirmDelete() {
    if (!this.selectedClubId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting club with ID:', this.selectedClubId);
      
      await this.http.delete(`${this.apiUrl}/clubs/${this.selectedClubId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      await this.loadClubs();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedClubId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Club deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting club:', error);
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedClubId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage(`Failed to delete club.`);
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
