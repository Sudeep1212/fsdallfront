import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { Comment } from '../../models/comment.model';
import { User, Admin } from '../../models/user.model';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './comment-modal.component.html',
  styleUrl: './comment-modal.component.scss'
})
export class CommentModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() commentAdded = new EventEmitter<Comment>();

  commentForm: FormGroup;
  isSubmitting = false;
  currentUser: User | Admin | null = null;
  errorMessage = '';
  showSuccess = false;

  constructor(
    private formBuilder: FormBuilder,
    private commentService: CommentService,
    private authService: AuthService
  ) {
    this.commentForm = this.formBuilder.group({
      content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.commentForm.valid && !this.isSubmitting && this.currentUser) {
      // Check if user is actually authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        this.errorMessage = 'No authentication token found. Please log in again.';
        return;
      }
      
      this.isSubmitting = true;
      this.errorMessage = '';
      const content = this.commentForm.get('content')?.value.trim();

      this.commentService.createComment(content).subscribe({
        next: (comment: Comment) => {
          this.showSuccess = true;
          this.commentAdded.emit(comment);
          this.commentForm.reset();
          
          // Show success message for 1.5 seconds then close
          setTimeout(() => {
            this.close.emit();
          }, 1500);
        },
        error: (error) => {
          console.error('Error creating comment:', error);
          this.isSubmitting = false;
          
          if (error.status === 401) {
            this.errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.status === 403) {
            this.errorMessage = 'You do not have permission to post comments.';
          } else if (error.status === 400) {
            this.errorMessage = 'Invalid comment content. Please check your input.';
          } else {
            this.errorMessage = 'Failed to post comment. Please try again.';
          }
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  get content() {
    return this.commentForm.get('content');
  }

  get characterCount(): number {
    return this.content?.value?.length || 0;
  }

  get maxLength(): number {
    return 500;
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return '';
    
    // Check if it's a User (has firstName and lastName) or Admin (has name)
    if ('firstName' in this.currentUser && 'lastName' in this.currentUser) {
      // User type - has firstName and lastName
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    } else if ('name' in this.currentUser) {
      // Admin type - has name property
      return this.currentUser.name;
    }
    
    return 'Unknown User';
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    // Check if it's a User (has firstName and lastName) or Admin (has name)
    if ('firstName' in this.currentUser && 'lastName' in this.currentUser) {
      // User type - use first letters of firstName and lastName
      const firstInitial = this.currentUser.firstName.charAt(0).toUpperCase();
      const lastInitial = this.currentUser.lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    } else if ('name' in this.currentUser) {
      // Admin type - use first two letters of name or first letter if short
      const name = this.currentUser.name.trim();
      if (name.includes(' ')) {
        // If name has space, use first letter of each word
        const parts = name.split(' ');
        return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
      } else {
        // Single name - use first two letters or just first if too short
        return name.length > 1 ? 
          `${name.charAt(0).toUpperCase()}${name.charAt(1).toUpperCase()}` : 
          name.charAt(0).toUpperCase();
      }
    }
    
    return 'U';
  }

  // Helper method to get initials from comment userName (for display consistency)
  getCommentUserInitials(userName: string): string {
    if (!userName) return 'U';
    
    const name = userName.trim();
    if (name.includes(' ')) {
      // If name has space, use first letter of each word
      const parts = name.split(' ').filter(part => part.length > 0);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0).toUpperCase()}${parts[1].charAt(0).toUpperCase()}`;
      }
    }
    
    // Fallback - use first two letters or just first if too short
    return name.length > 1 ? 
      `${name.charAt(0).toUpperCase()}${name.charAt(1).toUpperCase()}` : 
      name.charAt(0).toUpperCase();
  }
}