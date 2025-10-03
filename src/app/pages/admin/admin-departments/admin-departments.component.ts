import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Department {
  departmentId?: number;
  name: string;
}

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-departments.component.html',
  styleUrl: './admin-departments.component.scss'
})
export class AdminDepartmentsComponent implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  departmentForm: FormGroup;
  loading = false;
  error = '';
  
  selectedDepartmentId: number | null = null;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit() {
    this.loadDepartments();
  }

  async loadDepartments() {
    try {
      this.departments = await this.http.get<Department[]>(`${this.apiUrl}/departments`).toPromise() || [];
      this.filteredDepartments = [...this.departments];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading departments:', error);
      this.showErrorMessage('Failed to load departments');
    }
  }

  filterDepartments() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredDepartments = [...this.departments];
      return;
    }

    this.filteredDepartments = this.departments.filter(dept =>
      dept.name?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterDepartments();
  }

  openCreateModal() {
    this.departmentForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.departmentForm.reset();
  }

  async onSubmit() {
    if (this.departmentForm.valid) {
      this.loading = true;
      
      const departmentData = {
        name: this.departmentForm.value.name
      };

      try {
        await this.http.post<Department>(`${this.apiUrl}/departments`, departmentData).toPromise();
        
        setTimeout(() => {
          this.loading = false;
          this.closeCreateModal();
          this.loadDepartments();
          this.showSuccessMessage('Department created successfully!');
        }, 2000);
      } catch (error) {
        console.error('Error creating department:', error);
        this.loading = false;
        this.showErrorMessage('Error creating department');
      }
    }
  }

  openDeleteModal(departmentId: number) {
    this.selectedDepartmentId = departmentId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedDepartmentId = null;
  }

  async confirmDelete() {
    if (!this.selectedDepartmentId) return;
    
    this.loading = true;
    this.cdr.detectChanges(); // Force update to show "Deleting..."
    
    try {
      console.log('Deleting department with ID:', this.selectedDepartmentId);
      
      await this.http.delete(`${this.apiUrl}/departments/${this.selectedDepartmentId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      // Reload departments immediately
      this.loadDepartments();
      
      // Wait 3 seconds while showing "Deleting..." message
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now close the modal
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedDepartmentId = null;
      this.cdr.detectChanges(); // Force modal to close
      
      // Wait for modal animation to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Show success toast for 3 seconds
      console.log('About to show toast...');
      this.toastMessage = 'Department deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting department:', error);
      this.loading = false;
      this.showErrorMessage('Error deleting department');
      this.cdr.detectChanges();
    }
  }

  showSuccessMessage(message: string) {
    this.toastMessage = message;
    this.showSuccessToast = true;
    setTimeout(() => {
      this.showSuccessToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  showErrorMessage(message: string) {
    this.toastMessage = message;
    this.showErrorToast = true;
    setTimeout(() => {
      this.showErrorToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  get totalDepartments(): number {
    return this.departments.length;
  }
}
