import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Comment } from '../models/comment.model';
import { environment } from '../../environments/environment';

// Backend comment interface (matches backend response)
interface BackendComment {
  commentId: number;
  content: string;
  createdAt: string; // ISO date string from backend
  user: {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = environment.apiUrl || 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Get recent comments (for home page) - public endpoint
  getRecentComments(limit: number = 3): Observable<Comment[]> {
    return this.http.get<BackendComment[]>(`${this.apiUrl}/api/comments/recent?limit=${limit}`)
      .pipe(
        map(backendComments => backendComments.map(bc => this.transformBackendComment(bc))),
        catchError(error => {
          console.error('Error fetching recent comments:', error);
          return throwError(() => error);
        })
      );
  }

  // Get all comments - public endpoint
  getAllComments(): Observable<Comment[]> {
    return this.http.get<BackendComment[]>(`${this.apiUrl}/api/comments`)
      .pipe(
        map(backendComments => backendComments.map(bc => this.transformBackendComment(bc))),
        catchError(error => {
          console.error('Error fetching all comments:', error);
          return throwError(() => error);
        })
      );
  }

  // Create new comment (requires authentication)
  createComment(content: string): Observable<Comment> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not running in browser'));
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post<BackendComment>(`${this.apiUrl}/api/comments`, { content }, { headers })
      .pipe(
        map(backendComment => this.transformBackendComment(backendComment)),
        catchError(error => {
          console.error('Error creating comment:', error);
          return throwError(() => error);
        })
      );
  }

  // Delete comment (requires authentication)
  deleteComment(commentId: number): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not running in browser'));
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete<void>(`${this.apiUrl}/api/comments/${commentId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error deleting comment:', error);
          return throwError(() => error);
        })
      );
  }

  // Get comments by user (requires authentication)
  getCommentsByUserId(userId: number): Observable<Comment[]> {
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Not running in browser'));
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      return throwError(() => new Error('Authentication token not found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.get<BackendComment[]>(`${this.apiUrl}/api/comments/user/${userId}`, { headers })
      .pipe(
        map(backendComments => backendComments.map(bc => this.transformBackendComment(bc))),
        catchError(error => {
          console.error('Error fetching user comments:', error);
          return throwError(() => error);
        })
      );
  }

  // Get comments count - public endpoint
  getCommentsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/api/comments/count`)
      .pipe(
        catchError(error => {
          console.error('Error fetching comments count:', error);
          return throwError(() => error);
        })
      );
  }

  // Transform backend comment to frontend comment interface
  private transformBackendComment(backendComment: BackendComment): Comment {
    return {
      commentId: backendComment.commentId,
      content: backendComment.content,
      dateTime: new Date(backendComment.createdAt),
      userName: `${backendComment.user.firstName} ${backendComment.user.lastName}`,
      userEmail: backendComment.user.email,
      userId: backendComment.user.userId
    };
  }
}
