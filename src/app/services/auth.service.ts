import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse, LoginRequest, RegisterRequest, User, Admin } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://fsdallback.onrender.com/api/auth';
  private currentUserSubject = new BehaviorSubject<User | Admin | null>(null);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in on app start (only in browser)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.checkStoredAuth();
    }
  }

  // Register new user
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData, { headers }).pipe(
      tap((response) => {
        if (response.token && response.user) {
          this.setAuthData(response.token, response.user);
        }
      })
    );
  }

  // Login user
  login(loginData: LoginRequest): Observable<AuthResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData, { headers }).pipe(
      tap((response) => {
        if (response.token && response.user) {
          this.setAuthData(response.token, response.user);
        }
      })
    );
  }

  // Logout user
  logout(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  // Get current user
  getCurrentUser(): User | Admin | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Get auth token
  getToken(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // Private methods
  private setAuthData(token: string, user: User | Admin): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('authToken', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.isLoggedInSubject.next(true);
  }

  private checkStoredAuth(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('currentUser');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.currentUserSubject.next(user);
          this.isLoggedInSubject.next(true);
        } catch (error) {
          // Clear invalid stored data
          this.logout();
        }
      }
    }
  }
}
