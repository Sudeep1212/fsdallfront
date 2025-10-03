import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Registration {
  registrationId?: number;
  name: string;
  college: string;
  email: string;
  contact: string;
  registeredAt?: string;
}

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-registrations.component.html',
  styleUrl: './admin-registrations.component.scss'
})
export class AdminRegistrationsComponent implements OnInit {
  registrations: Registration[] = [];
  filteredRegistrations: Registration[] = [];
  searchTerm: string = '';
  
  showDeleteModal = false;
  selectedRegistrationId: number | null = null;
  loading = false;
  
  toastMessage = '';
  showSuccessToast = false;
  showErrorToast = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('=== Registrations Component Initialized ===');
    this.loadRegistrations();
  }

  async loadRegistrations() {
    try {
      this.registrations = await this.http.get<Registration[]>(`${this.apiUrl}/registrations`).toPromise() || [];
      console.log('Loaded registrations:', this.registrations);
      this.filteredRegistrations = [...this.registrations];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading registrations:', error);
    }
  }

  filterRegistrations() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredRegistrations = [...this.registrations];
      return;
    }

    this.filteredRegistrations = this.registrations.filter(registration =>
      registration.name.toLowerCase().includes(term) ||
      registration.college.toLowerCase().includes(term) ||
      registration.email.toLowerCase().includes(term) ||
      registration.contact.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterRegistrations();
  }

  get totalRegistrations(): number {
    return this.registrations.length;
  }

  get activeRegistrations(): number {
    return this.filteredRegistrations.length;
  }

  openDeleteModal(registrationId: number) {
    this.selectedRegistrationId = registrationId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedRegistrationId = null;
  }

  async confirmDelete() {
    if (!this.selectedRegistrationId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      await this.http.delete(`${this.apiUrl}/registrations/${this.selectedRegistrationId}`, { responseType: 'text' }).toPromise();
      
      await this.loadRegistrations();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedRegistrationId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Registration deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting registration:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedRegistrationId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete registration.');
    }
  }

  showErrorMessage(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    setTimeout(() => {
      this.showErrorToast = false;
    }, 3000);
  }
}
