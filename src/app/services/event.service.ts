import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Event } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Get all events
  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events`);
  }

  // Get upcoming events (next 9 for home page)
  getUpcomingEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.apiUrl}/events/upcoming`);
  }

  // Get next event for timer
  getNextEvent(): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/next`);
  }

  // Get event by ID
  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/events/${id}`);
  }

  // Create event (admin only)
  createEvent(event: Event): Observable<Event> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<Event>(`${this.apiUrl}/events`, event, { headers });
  }

  // Update event (admin only)
  updateEvent(id: number, event: Event): Observable<Event> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<Event>(`${this.apiUrl}/events/${id}`, event, { headers });
  }

  // Get completed events count
  getCompletedEventsCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/events/completed/count`);
  }
}
