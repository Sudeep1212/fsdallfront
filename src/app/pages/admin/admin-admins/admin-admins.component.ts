import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Admin {
  adminId?: number;
  name: string;
  email: string;
  password?: string; // Only used for create/edit, never displayed
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-admins.component.html',
  styleUrl: './admin-admins.component.scss'
})
export class AdminAdminsComponent implements OnInit {
  admins: Admin[] = [];
  filteredAdmins: Admin[] = [];
  searchTerm: string = '';
  
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  adminForm: FormGroup;
  loading = false;
  error = '';
  
  selectedAdminId: number | null = null;
  currentAdminId: number | null = null; // For self-delete protection
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.adminForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['ADMIN', Validators.required]
    });
  }

  ngOnInit() {
    console.log('=== Admins Component Initialized ===');
    this.loadCurrentAdminId();
    this.loadAdmins();
  }

  /**
   * Load current admin ID from localStorage for self-delete protection
   */
  loadCurrentAdminId() {
    // Only run in browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentAdminId = user.userId; // Admin ID stored as userId in UserResponse
        console.log('Current Admin ID:', this.currentAdminId);
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
  }

  /**
   * Check if the admin is the current logged-in admin (for self-delete protection)
   */
  isCurrentAdmin(adminId: number): boolean {
    return this.currentAdminId !== null && adminId === this.currentAdminId;
  }

  async loadAdmins() {
    try {
      this.admins = await this.http.get<Admin[]>(`${this.apiUrl}/admins`).toPromise() || [];
      console.log('Loaded admins:', this.admins);
      this.filteredAdmins = [...this.admins];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading admins:', error);
      this.showErrorMessage('Failed to load admins');
    }
  }

  filterAdmins() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredAdmins = [...this.admins];
      return;
    }

    this.filteredAdmins = this.admins.filter(admin =>
      admin.name?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term) ||
      admin.role?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterAdmins();
  }

  get totalAdmins(): number {
    return this.admins.length;
  }

  get activeAdmins(): number {
    return this.filteredAdmins.length;
  }

  // ========== CREATE ==========
  openCreateModal() {
    this.showCreateModal = true;
    this.adminForm.reset({ role: 'ADMIN' });
    // Password is required for create
    this.adminForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.adminForm.get('password')?.updateValueAndValidity();
    this.error = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.adminForm.reset();
    this.error = '';
  }

  async onSubmit() {
    if (this.adminForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const adminData = {
        name: this.adminForm.value.name,
        email: this.adminForm.value.email,
        password: this.adminForm.value.password, // Will be bcrypt hashed on backend
        role: this.adminForm.value.role
      };
      
      await this.http.post<Admin>(`${this.apiUrl}/admins`, adminData).toPromise();
      
      this.closeCreateModal();
      this.showSuccessMessage('Admin created successfully! Password has been securely hashed.');
      await this.loadAdmins();
    } catch (error: any) {
      console.error('Error creating admin:', error);
      this.error = error?.error || 'Failed to create admin. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // ========== EDIT ==========
  openEditModal(admin: Admin) {
    this.selectedAdminId = admin.adminId!;
    this.showEditModal = true;
    
    // Populate form without password
    this.adminForm.patchValue({
      name: admin.name,
      email: admin.email,
      password: '', // Leave password empty
      role: admin.role
    });
    
    // Password is optional for edit
    this.adminForm.get('password')?.clearValidators();
    this.adminForm.get('password')?.updateValueAndValidity();
    
    this.error = '';
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedAdminId = null;
    this.adminForm.reset();
    this.error = '';
  }

  async onUpdate() {
    if (this.adminForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    if (!this.selectedAdminId) return;

    this.loading = true;
    this.error = '';

    try {
      const adminData: any = {
        name: this.adminForm.value.name,
        email: this.adminForm.value.email,
        role: this.adminForm.value.role
      };
      
      // Only include password if it's been changed
      if (this.adminForm.value.password && this.adminForm.value.password.trim() !== '') {
        adminData.password = this.adminForm.value.password; // Will be bcrypt hashed on backend
      }
      
      await this.http.put<Admin>(`${this.apiUrl}/admins/${this.selectedAdminId}`, adminData).toPromise();
      
      this.closeEditModal();
      this.showSuccessMessage('Admin updated successfully!');
      await this.loadAdmins();
    } catch (error: any) {
      console.error('Error updating admin:', error);
      this.error = error?.error || 'Failed to update admin. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  // ========== DELETE ==========
  openDeleteModal(adminId: number) {
    this.selectedAdminId = adminId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedAdminId = null;
  }

  async confirmDelete() {
    if (!this.selectedAdminId) return;
    
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    try {
      console.log('Deleting admin with ID:', this.selectedAdminId);
      
      await this.http.delete(`${this.apiUrl}/admins/${this.selectedAdminId}`, { responseType: 'text' }).toPromise();
      
      console.log('Delete successful!');
      
      await this.loadAdmins();
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedAdminId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Admin deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedAdminId = null;
      this.cdr.detectChanges();
      
      this.showErrorMessage('Failed to delete admin.');
    }
  }

  showSuccessMessage(message: string): void {
    this.toastMessage = message;
    this.showSuccessToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showSuccessToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }

  showErrorMessage(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showErrorToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
