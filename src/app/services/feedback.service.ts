import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, timeout, catchError, of } from 'rxjs';
import { Feedback, FeedbackRequest, FeedbackResponse } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = 'http://localhost:8080/api/feedbacks';
  private readonly FEEDBACK_SUBMITTED_KEY = 'feedback_submitted';

  constructor(private http: HttpClient) {}

  // Submit feedback
  submitFeedback(feedbackData: FeedbackRequest): Observable<FeedbackResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Optimized HTTP options for fastest response
    const httpOptions = {
      headers
    };
    
    return this.http.post<FeedbackResponse>(this.apiUrl, feedbackData, httpOptions).pipe(
      timeout(8000), // 8 second timeout to prevent infinite loading
      map(response => {
        console.log('HTTP Response received:', response);
        // Mark feedback as submitted in localStorage immediately
        this.markFeedbackAsSubmitted(feedbackData.email);
        return response;
      }),
      catchError(error => {
        console.error('HTTP Error in feedback service:', error);
        throw error; // Re-throw to let component handle it
      })
    );
  }

  // Check if user has already submitted feedback
  hasFeedbackBeenSubmitted(email: string): boolean {
    const submittedEmails = this.getSubmittedFeedbackEmails();
    return submittedEmails.includes(email);
  }

  // Mark feedback as submitted for a user
  private markFeedbackAsSubmitted(email: string): void {
    const submittedEmails = this.getSubmittedFeedbackEmails();
    if (!submittedEmails.includes(email)) {
      submittedEmails.push(email);
      localStorage.setItem(this.FEEDBACK_SUBMITTED_KEY, JSON.stringify(submittedEmails));
    }
  }

  // Get list of emails that have submitted feedback
  private getSubmittedFeedbackEmails(): string[] {
    const stored = localStorage.getItem(this.FEEDBACK_SUBMITTED_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Reset feedback submission status (for testing/admin purposes)
  resetFeedbackStatus(email?: string): void {
    if (email) {
      const submittedEmails = this.getSubmittedFeedbackEmails();
      const filtered = submittedEmails.filter(e => e !== email);
      localStorage.setItem(this.FEEDBACK_SUBMITTED_KEY, JSON.stringify(filtered));
    } else {
      localStorage.removeItem(this.FEEDBACK_SUBMITTED_KEY);
    }
  }

  // Get all feedbacks (admin use)
  getAllFeedbacks(): Observable<FeedbackResponse[]> {
    return this.http.get<FeedbackResponse[]>(this.apiUrl);
  }

  // Get feedback by ID
  getFeedbackById(id: number): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.apiUrl}/${id}`);
  }

  // Update feedback
  updateFeedback(id: number, feedbackData: FeedbackRequest): Observable<FeedbackResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.put<FeedbackResponse>(`${this.apiUrl}/${id}`, feedbackData, { headers });
  }

  // Delete feedback
  deleteFeedback(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}