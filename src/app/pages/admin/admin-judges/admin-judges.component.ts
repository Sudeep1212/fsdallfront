import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Judge {
  judge_id?: number;
  judge_name: string;
}

@Component({
  selector: 'app-admin-judges',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-judges.component.html',
  styleUrl: './admin-judges.component.scss'
})
export class AdminJudgesComponent implements OnInit {
  judges: Judge[] = [];
  filteredJudges: Judge[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  judgeForm: FormGroup;
  loading = false;
  error = '';
  
  selectedJudgeId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.judgeForm = this.fb.group({
      judge_name: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  ngOnInit() {
    this.loadJudges();
  }

  async loadJudges() {
    try {
      this.judges = await this.http.get<Judge[]>(`${this.apiUrl}/judges`).toPromise() || [];
      this.filteredJudges = [...this.judges];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading judges:', error);
      this.showErrorMessage('Failed to load judges');
    }
  }

  filterJudges() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredJudges = [...this.judges];
      return;
    }

    this.filteredJudges = this.judges.filter(judge =>
      judge.judge_name?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterJudges();
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.judgeForm.reset();
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.judgeForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.judgeForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const formValue = this.judgeForm.value;
      const judgeData = {
        judge_name: formValue.judge_name
      };
      
      await this.http.post<Judge>(`${this.apiUrl}/judges`, judgeData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Judge created successfully!');
      await this.loadJudges();
    } catch (error: any) {
      console.error('Error creating judge:', error);
      this.error = error?.error?.message || 'Failed to create judge. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  openDeleteModal(judgeId: number) {
    this.selectedJudgeId = judgeId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedJudgeId = null;
  }

  async confirmDelete() {
    if (!this.selectedJudgeId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting judge with ID:', this.selectedJudgeId);
      
      await this.http.delete(`${this.apiUrl}/judges/${this.selectedJudgeId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      await this.loadJudges();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedJudgeId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Judge deleted successfully!';
      this.showSuccessToast = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting judge:', error);
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedJudgeId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage(`Failed to delete judge.`);
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
