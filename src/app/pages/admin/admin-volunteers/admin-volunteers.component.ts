import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Volunteer {
  volunteerId?: number;
  name: string;
  role: string;
  contact: string;
  isAssigned: boolean;
  clubId?: number;
  clubName?: string;
  departmentId?: number;
  departmentName?: string;
  venueId?: number;
  venueName?: string;
  eventId?: number;
  eventName?: string;
}

interface Club {
  club_id: number;
  name: string;
}

interface Department {
  departmentId: number;
  name: string;
}

interface Venue {
  venue_id: number;
  name: string;
}

interface Event {
  event_id: number;
  name: string;
}

@Component({
  selector: 'app-admin-volunteers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-volunteers.component.html',
  styleUrl: './admin-volunteers.component.scss'
})
export class AdminVolunteersComponent implements OnInit {
  volunteers: Volunteer[] = [];
  filteredVolunteers: Volunteer[] = [];
  clubs: Club[] = [];
  departments: Department[] = [];
  venues: Venue[] = [];
  events: Event[] = [];
  searchTerm: string = '';
  showCreateModal: boolean = false;
  showDeleteModal: boolean = false;
  selectedVolunteerId: number | null = null;
  loading: boolean = false;
  error: string = '';
  toastMessage: string = '';
  showSuccessToast: boolean = false;
  showErrorToast: boolean = false;

  volunteerForm: FormGroup;
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.volunteerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      role: ['', [Validators.required, Validators.minLength(3)]],
      contact: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      isAssigned: [false, Validators.required],
      club_id: [null],
      department_id: [null],
      venue_id: [null],
      event_id: [null]
    });
  }

  async ngOnInit() {
    await this.loadVolunteers();
    await this.loadClubs();
    await this.loadDepartments();
    await this.loadVenues();
    await this.loadEvents();
  }

  async loadVolunteers() {
    try {
      this.volunteers = await firstValueFrom(
        this.http.get<Volunteer[]>(`${this.apiUrl}/volunteers`)
      );
      this.filteredVolunteers = [...this.volunteers];
    } catch (error: any) {
      console.error('Error loading volunteers:', error);
      this.error = 'Failed to load volunteers';
    }
  }

  async loadClubs() {
    try {
      this.clubs = await firstValueFrom(
        this.http.get<Club[]>(`${this.apiUrl}/clubs`)
      );
    } catch (error: any) {
      console.error('Error loading clubs:', error);
    }
  }

  async loadDepartments() {
    try {
      this.departments = await firstValueFrom(
        this.http.get<Department[]>(`${this.apiUrl}/departments`)
      );
    } catch (error: any) {
      console.error('Error loading departments:', error);
    }
  }

  async loadVenues() {
    try {
      this.venues = await firstValueFrom(
        this.http.get<Venue[]>(`${this.apiUrl}/venues`)
      );
    } catch (error: any) {
      console.error('Error loading venues:', error);
    }
  }

  async loadEvents() {
    try {
      this.events = await firstValueFrom(
        this.http.get<Event[]>(`${this.apiUrl}/events`)
      );
    } catch (error: any) {
      console.error('Error loading events:', error);
    }
  }

  filterVolunteers() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredVolunteers = [...this.volunteers];
      return;
    }

    this.filteredVolunteers = this.volunteers.filter(volunteer =>
      volunteer.name?.toLowerCase().includes(term) ||
      volunteer.role?.toLowerCase().includes(term) ||
      volunteer.clubName?.toLowerCase().includes(term) ||
      volunteer.departmentName?.toLowerCase().includes(term) ||
      volunteer.venueName?.toLowerCase().includes(term) ||
      volunteer.eventName?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterVolunteers();
  }

  openCreateModal() {
    this.volunteerForm.reset({
      isAssigned: false
    });
    this.showCreateModal = true;
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.volunteerForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.volunteerForm.invalid) {
      this.error = 'Please fill all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formData = this.volunteerForm.value;
      const volunteerData: any = {
        name: formData.name,
        role: formData.role,
        contact: formData.contact,
        isAssigned: formData.isAssigned
      };

      if (formData.club_id) {
        volunteerData.club = { club_id: formData.club_id };
      }
      if (formData.department_id) {
        volunteerData.department = { departmentId: formData.department_id };
      }
      if (formData.venue_id) {
        volunteerData.venue = { venue_id: formData.venue_id };
      }
      if (formData.event_id) {
        volunteerData.event = { event_id: formData.event_id };
      }

      await firstValueFrom(
        this.http.post(`${this.apiUrl}/volunteers`, volunteerData)
      );

      await this.loadVolunteers();
      this.loading = false;
      this.closeCreateModal();
      
      this.toastMessage = 'Volunteer created successfully!';
      this.showSuccessToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
    } catch (error: any) {
      this.loading = false;
      this.error = error.error?.message || 'Failed to create volunteer';
      
      this.toastMessage = this.error;
      this.showErrorToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showErrorToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  openDeleteModal(id: number) {
    this.selectedVolunteerId = id;
    this.showDeleteModal = true;
    this.error = '';
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedVolunteerId = null;
    this.error = '';
  }

  async confirmDelete() {
    if (!this.selectedVolunteerId) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    try {
      await this.http.delete(`${this.apiUrl}/volunteers/${this.selectedVolunteerId}`, { responseType: 'text' }).toPromise();
      
      await this.loadVolunteers();
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.loading = false;
      this.showDeleteModal = false;
      this.selectedVolunteerId = null;
      this.cdr.detectChanges();

      await new Promise(resolve => setTimeout(resolve, 300));

      this.toastMessage = 'Volunteer deleted successfully!';
      this.showSuccessToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
    } catch (error: any) {
      this.loading = false;
      this.error = 'Failed to delete volunteer';
      
      this.toastMessage = this.error;
      this.showErrorToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.showErrorToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
  }
}
