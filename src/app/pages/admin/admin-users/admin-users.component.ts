import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface User {
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  college: string;
  contact: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  
  showDeleteModal = false;
  selectedUserId: number | null = null;
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
    console.log('=== Users Component Initialized ===');
    this.loadUsers();
  }

  async loadUsers() {
    try {
      this.users = await this.http.get<User[]>(`${this.apiUrl}/users`).toPromise() || [];
      console.log('Loaded users:', this.users);
      this.filteredUsers = [...this.users];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  filterUsers() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter(user =>
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.college.toLowerCase().includes(term) ||
      user.contact.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterUsers();
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.filteredUsers.length;
  }

  get fullName(): (user: User) => string {
    return (user: User) => `${user.firstName} ${user.lastName}`;
  }

  openDeleteModal(userId: number) {
    this.selectedUserId = userId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedUserId = null;
  }

  async confirmDelete() {
    if (!this.selectedUserId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      await this.http.delete(`${this.apiUrl}/users/${this.selectedUserId}`, { responseType: 'text' }).toPromise();
      
      await this.loadUsers();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedUserId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'User deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedUserId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete user.');
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
