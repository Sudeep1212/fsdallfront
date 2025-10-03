import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrationRequest {
  name: string;
  college: string;
  email: string;
  contact: string;
}

export interface RegistrationResponse {
  registrationId: number;
  name: string;
  college: string;
  email: string;
  contact: string;
}

export interface ParticipationRequest {
  registration: RegistrationResponse;
  event: any;
  eventAmount: number;
}

export interface ParticipationResponse {
  participationId: number;
  registration: RegistrationResponse;
  event: any;
  eventAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Create registration
  createRegistration(registrationData: RegistrationRequest): Observable<RegistrationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<RegistrationResponse>(`${this.apiUrl}/registrations`, registrationData, { headers });
  }

  // Create participation
  createParticipation(participationData: ParticipationRequest): Observable<ParticipationResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<ParticipationResponse>(`${this.apiUrl}/participations`, participationData, { headers });
  }

  // Get registration by ID
  getRegistrationById(id: number): Observable<RegistrationResponse> {
    return this.http.get<RegistrationResponse>(`${this.apiUrl}/registrations/${id}`);
  }

  // Get participation by ID
  getParticipationById(id: number): Observable<ParticipationResponse> {
    return this.http.get<ParticipationResponse>(`${this.apiUrl}/participations/${id}`);
  }

  // Generate participant ID from participation ID
  generateParticipantId(participationId: number): string {
    return `P${participationId.toString().padStart(8, '0')}`;
  }

  // Get event fee from backend
  getEventFee(eventId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/events/${eventId}/fee`);
  }
}