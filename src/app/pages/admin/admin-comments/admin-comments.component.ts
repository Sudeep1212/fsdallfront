import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Comment {
  commentId?: number;
  content: string;
  createdAt?: string;
  userId: number;
  userName: string;
  userEmail: string;
}

@Component({
  selector: 'app-admin-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-comments.component.html',
  styleUrl: './admin-comments.component.scss'
})
export class AdminCommentsComponent implements OnInit {
  comments: Comment[] = [];
  filteredComments: Comment[] = [];
  searchTerm: string = '';
  
  showDeleteModal = false;
  selectedCommentId: number | null = null;
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
    console.log('=== Comments Component Initialized ===');
    this.loadComments();
  }

  async loadComments() {
    try {
      this.comments = await this.http.get<Comment[]>(`${this.apiUrl}/admin/comments`).toPromise() || [];
      console.log('Loaded comments:', this.comments);
      this.filteredComments = [...this.comments];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  }

  filterComments() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredComments = [...this.comments];
      return;
    }

    this.filteredComments = this.comments.filter(comment =>
      comment.content.toLowerCase().includes(term) ||
      comment.userName.toLowerCase().includes(term) ||
      comment.userEmail.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterComments();
  }

  get totalComments(): number {
    return this.comments.length;
  }

  get activeComments(): number {
    return this.filteredComments.length;
  }

  // Truncate long comments for table display
  truncateContent(content: string, maxLength: number = 100): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  openDeleteModal(commentId: number) {
    this.selectedCommentId = commentId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCommentId = null;
  }

  async confirmDelete() {
    if (!this.selectedCommentId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      await this.http.delete(`${this.apiUrl}/admin/comments/${this.selectedCommentId}`, { responseType: 'text' }).toPromise();
      
      await this.loadComments();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedCommentId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Comment deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedCommentId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete comment.');
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
