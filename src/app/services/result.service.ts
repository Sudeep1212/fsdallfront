import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Result, 
  ResultDisplay, 
  ResultsResponse, 
  StatisticsResponse, 
  Registration,
  Participation,
  BackendEvent 
} from '../models/result.model';

@Injectable({
  providedIn: 'root'
})
export class ResultService {
  private apiUrl = (environment.apiUrl || 'http://localhost:8080') + '/api';
  
  // BehaviorSubjects for reactive data management
  private resultsSubject = new BehaviorSubject<ResultDisplay[]>([]);
  public results$ = this.resultsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all results from the backend
   */
  getAllResults(): Observable<Result[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);
    
    const fullUrl = `${this.apiUrl}/results`;
    
    return this.http.get<Result[]>(fullUrl).pipe(
      map(results => {
        console.log('✅ Results loaded from API:', results?.length || 0, 'records');
        this.loadingSubject.next(false);
        return results;
      }),
      catchError(error => {
        console.error('❌ Error fetching results:', error.status, error.statusText);
        this.errorSubject.next('Failed to load results. Please try again.');
        this.loadingSubject.next(false);
        return of([]);
      })
    );
  }

  /**
   * Get results with display formatting
   */
  getFormattedResults(): Observable<ResultDisplay[]> {
    return this.getAllResults().pipe(
      map(results => {
        const transformed = this.transformResultsToDisplay(results);
        console.log('� Formatted results for display:', transformed.length, 'records');
        return transformed;
      })
    );
  }

  /**
   * Get filtered results based on search and filter criteria
   */
  getFilteredResults(
    searchTerm?: string,
    eventType?: string,
    rankRange?: string
  ): Observable<ResultDisplay[]> {
    return this.getFormattedResults().pipe(
      map(results => this.applyFilters(results, searchTerm, eventType, rankRange))
    );
  }

  /**
   * Get statistics for the dashboard
   */
  getStatistics(): Observable<StatisticsResponse> {
    return this.getFormattedResults().pipe(
      map(results => this.calculateStatistics(results))
    );
  }

  /**
   * Get unique event types for filter dropdown
   */
  getUniqueEventTypes(): Observable<string[]> {
    return this.getFormattedResults().pipe(
      map(results => {
        const eventTypes = [...new Set(results.map(r => r.eventType))];
        return eventTypes.sort();
      })
    );
  }

  /**
   * Transform backend Result objects to display-friendly ResultDisplay objects
   * Following relationship chain: Result -> Participation -> Registration -> Events -> Club
   */
  private transformResultsToDisplay(results: Result[]): ResultDisplay[] {
    const transformedResults = results.map(result => {
      // Extract data from the relationship chain
      const participation = result.participation;
      const registration = participation.registration;
      const event = result.event;
      const club = event.club;
      
      return {
        resultId: result.resultId,
        rank: result.rank,
        // Format participant ID as "STU" + participation ID (padded with zeros)
        participantId: `STU${participation.participationId.toString().padStart(3, '0')}`,
        participantName: registration.name,
        participantInitials: this.getInitials(registration.name),
        participantCollege: registration.college,
        eventName: event.event_name,
        eventType: event.event_type,
        eventStartDate: event.event_start_date,
        eventEndDate: event.event_end_date,
        daysAgo: this.calculateDaysAgo(event.event_start_date),
        score: result.score,
        scorePercentage: Math.min(result.score, 100),
        // Club name from the club entity associated with the event
        conductedBy: club?.name || 'Unknown Club'
      } as ResultDisplay;
    });
    
    return transformedResults;
  }

  /**
   * Apply search and filter criteria to results
   */
  private applyFilters(
    results: ResultDisplay[],
    searchTerm?: string,
    eventType?: string,
    rankRange?: string
  ): ResultDisplay[] {
    return results.filter(result => {
      // Search filter
      const matchesSearch = !searchTerm || 
        result.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.participantCollege.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.conductedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Event type filter
      const matchesEventType = !eventType || result.eventType === eventType;
      
      // Rank range filter
      const matchesRankRange = !rankRange || this.isInRankRange(result.rank, rankRange);
      
      return matchesSearch && matchesEventType && matchesRankRange;
    });
  }

  /**
   * Check if rank falls within the specified range
   */
  private isInRankRange(rank: number, range: string): boolean {
    switch (range) {
      case '1-3':
        return rank >= 1 && rank <= 3;
      case '4-10':
        return rank >= 4 && rank <= 10;
      case '11+':
        return rank >= 11;
      default:
        return true;
    }
  }

  /**
   * Calculate statistics from results
   * - Top performers: participants with rank 1-3
   * - Events completed: unique events where end date has passed
   * - Total participants: unique count of participants across all events
   */
  private calculateStatistics(results: ResultDisplay[]): StatisticsResponse {
    // Count participants who finished in top 3 positions
    const topPerformers = results.filter(r => r.rank <= 3).length;
    
    // Count completed events based on event end date
    const today = new Date();
    const uniqueCompletedEvents = new Set(
      results
        .filter(r => new Date(r.eventEndDate) <= today)
        .map(r => r.eventName)
    );
    
    // Count total unique participants across all results
    const totalParticipants = new Set(results.map(r => r.participantId)).size;
    
    return {
      topPerformers,
      eventsCompleted: uniqueCompletedEvents.size,
      totalParticipants
    };
  }

  /**
   * Get participant initials from name
   */
  private getInitials(name: string): string {
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Calculate days ago from a date string
   */
  private calculateDaysAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }



  /**
   * Refresh results data
   */
  refreshResults(): void {
    this.getFormattedResults().subscribe(results => {
      this.resultsSubject.next(results);
      this.loadingSubject.next(false);
    });
  }

  /**
   * Get result by ID
   */
  getResultById(id: number): Observable<Result | null> {
    return this.http.get<Result>(`${this.apiUrl}/results/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching result by ID:', error);
        return of(null);
      })
    );
  }

  // Legacy methods for backward compatibility (can be removed later)
  /**
   * @deprecated Use getFilteredResults instead
   */
  getResultsByEventName(eventName: string, page: number = 0, size: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('eventName', eventName)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<any>(`${this.apiUrl}/results/search`, { params });
  }

  /**
   * Create result (admin only)
   */
  createResult(result: Result): Observable<Result> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<Result>(`${this.apiUrl}/results`, result, { headers });
  }

  /**
   * Update result (admin only)
   */
  updateResult(id: number, result: Result): Observable<Result> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.put<Result>(`${this.apiUrl}/results/${id}`, result, { headers });
  }

  /**
   * Delete result (admin only)
   */
  deleteResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/results/${id}`);
  }
}