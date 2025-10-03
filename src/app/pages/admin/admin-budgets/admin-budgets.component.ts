import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Budget {
  budgetId?: number;
  allocatedAmount: number;
  utilizedAmount: number;
  sponsorId: number | null;
  sponsorName?: string;
  clubId: number | null;
  clubName?: string;
  eventId: number | null;
  eventName?: string;
}

interface Sponsor {
  sponsorId: number;
  name: string;
}

interface Club {
  club_id: number;
  name: string;
}

interface Event {
  event_id: number;
  event_name: string;
}

@Component({
  selector: 'app-admin-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-budgets.component.html',
  styleUrl: './admin-budgets.component.scss'
})
export class AdminBudgetsComponent implements OnInit {
  budgets: Budget[] = [];
  sponsors: Sponsor[] = [];
  clubs: Club[] = [];
  events: Event[] = [];
  filteredBudgets: Budget[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  budgetForm: FormGroup;
  loading = false;
  error = '';
  
  selectedBudgetId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.budgetForm = this.fb.group({
      allocatedAmount: ['', [Validators.required, Validators.min(0)]],
      utilizedAmount: ['', [Validators.required, Validators.min(0)]],
      sponsorId: [null, Validators.required],
      clubId: [null, Validators.required],
      eventId: [null, Validators.required]
    }, { validators: this.budgetValidator });
  }

  // Custom validator to ensure utilized amount doesn't exceed allocated amount
  budgetValidator(group: FormGroup) {
    const allocated = group.get('allocatedAmount')?.value;
    const utilized = group.get('utilizedAmount')?.value;
    
    if (allocated && utilized && parseFloat(utilized) > parseFloat(allocated)) {
      return { budgetExceeded: true };
    }
    return null;
  }

  ngOnInit() {
    this.loadBudgets();
    this.loadSponsors();
    this.loadClubs();
    this.loadEvents();
  }

  loadBudgets() {
    this.http.get<Budget[]>(`${this.apiUrl}/budgets`).subscribe({
      next: (data) => {
        this.budgets = data;
        this.filteredBudgets = data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading budgets:', error);
        this.error = 'Failed to load budgets';
      }
    });
  }

  loadSponsors() {
    this.http.get<Sponsor[]>(`${this.apiUrl}/sponsors`).subscribe({
      next: (data) => {
        this.sponsors = data;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading sponsors:', error)
    });
  }

  loadClubs() {
    this.http.get<Club[]>(`${this.apiUrl}/clubs`).subscribe({
      next: (data) => {
        this.clubs = data;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading clubs:', error)
    });
  }

  loadEvents() {
    this.http.get<Event[]>(`${this.apiUrl}/events`).subscribe({
      next: (data) => {
        this.events = data;
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error loading events:', error)
    });
  }

  get totalBudgets(): number {
    return this.budgets.length;
  }

  filterBudgets() {
    const term = this.searchTerm.toLowerCase();
    this.filteredBudgets = this.budgets.filter(budget =>
      budget.sponsorName?.toLowerCase().includes(term) ||
      budget.clubName?.toLowerCase().includes(term) ||
      budget.eventName?.toLowerCase().includes(term) ||
      budget.allocatedAmount.toString().includes(term) ||
      budget.utilizedAmount.toString().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredBudgets = this.budgets;
  }

  openCreateModal() {
    this.budgetForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.budgetForm.reset();
  }

  onSubmit() {
    if (this.budgetForm.valid) {
      this.loading = true;
      
      const budgetData = {
        allocatedAmount: this.budgetForm.value.allocatedAmount,
        utilizedAmount: this.budgetForm.value.utilizedAmount,
        sponsor: { sponsorId: this.budgetForm.value.sponsorId },
        club: { club_id: this.budgetForm.value.clubId },
        event: { event_id: this.budgetForm.value.eventId }
      };

      this.http.post<Budget>(`${this.apiUrl}/budgets`, budgetData).subscribe({
        next: (response) => {
          setTimeout(() => {
            this.loading = false;
            this.closeCreateModal();
            this.loadBudgets();
            this.showToast('Budget created successfully!', 'success');
          }, 2000);
        },
        error: (error) => {
          console.error('Error creating budget:', error);
          this.loading = false;
          this.showToast('Error creating budget', 'error');
        }
      });
    }
  }

  openDeleteModal(budgetId: number) {
    this.selectedBudgetId = budgetId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedBudgetId = null;
  }

  async confirmDelete() {
    if (!this.selectedBudgetId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges(); // Force update to show "Deleting..."
    
    try {
      console.log('Deleting budget with ID:', this.selectedBudgetId);
      
      await this.http.delete(`${this.apiUrl}/budgets/${this.selectedBudgetId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      // Reload budgets immediately
      this.loadBudgets();
      
      // Wait 3 seconds while showing "Deleting..." message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now close the modal
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedBudgetId = null;
      this.cdr.detectChanges(); // Force modal to close
      
      // Wait for modal animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show success toast for 3 seconds
      console.log('About to show toast...');
      this.toastMessage = 'Budget deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting budget:', error);
      this.loading = false;
      this.error = 'Failed to delete budget. Please try again.';
      this.cdr.detectChanges();
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    if (type === 'success') {
      this.showSuccessToast = true;
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
    } else {
      this.showErrorToast = true;
      setTimeout(() => {
        this.showErrorToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
  }
}
