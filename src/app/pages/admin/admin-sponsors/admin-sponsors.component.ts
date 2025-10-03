import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Sponsor {
  sponsorId?: number;
  name: string;
  isCash: boolean;
  mode: string;
  contact: string;
  clubId?: number;
  clubName?: string;
}

interface Club {
  club_id: number;
  name: string;
}

@Component({
  selector: 'app-admin-sponsors',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-sponsors.component.html',
  styleUrl: './admin-sponsors.component.scss'
})
export class AdminSponsorsComponent implements OnInit {
  sponsors: Sponsor[] = [];
  clubs: Club[] = [];
  filteredSponsors: Sponsor[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  sponsorForm: FormGroup;
  loading = false;
  error = '';
  
  selectedSponsorId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.sponsorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      isCash: [false, Validators.required],
      mode: ['', [Validators.required, Validators.minLength(3)]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      club_id: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.loadSponsors();
    this.loadClubs();
  }

  async loadSponsors() {
    try {
      this.sponsors = await this.http.get<Sponsor[]>(`${this.apiUrl}/sponsors`).toPromise() || [];
      this.filteredSponsors = [...this.sponsors];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading sponsors:', error);
      this.showErrorMessage('Failed to load sponsors');
    }
  }

  async loadClubs() {
    try {
      this.clubs = await this.http.get<Club[]>(`${this.apiUrl}/clubs`).toPromise() || [];
    } catch (error) {
      console.error('Error loading clubs:', error);
    }
  }

  filterSponsors() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredSponsors = [...this.sponsors];
      return;
    }

    this.filteredSponsors = this.sponsors.filter(sponsor =>
      sponsor.name?.toLowerCase().includes(term) ||
      sponsor.mode?.toLowerCase().includes(term) ||
      sponsor.clubName?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterSponsors();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.sponsorForm.reset();
    this.sponsorForm.patchValue({ isCash: false });
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.sponsorForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.sponsorForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.sponsorForm.value;
      const sponsorData = {
        name: formValue.name,
        isCash: formValue.isCash,
        mode: formValue.mode,
        contact: formValue.contact,
        club: {
          club_id: parseInt(formValue.club_id)
        }
      };
      
      await this.http.post<Sponsor>(`${this.apiUrl}/sponsors`, sponsorData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Sponsor created successfully!');
      await this.loadSponsors();
    } catch (error: any) {
      console.error('Error creating sponsor:', error);
      this.error = error?.error?.message || 'Failed to create sponsor. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(sponsorId: number) {
    this.selectedSponsorId = sponsorId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedSponsorId = null;
  }

  async confirmDelete() {
    if (!this.selectedSponsorId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting sponsor with ID:', this.selectedSponsorId);
      
      await this.http.delete(`${this.apiUrl}/sponsors/${this.selectedSponsorId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      await this.loadSponsors();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedSponsorId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Sponsor deleted successfully!';
      this.showSuccessToast = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting sponsor:', error);
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedSponsorId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage(`Failed to delete sponsor.`);
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
