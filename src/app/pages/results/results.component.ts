import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ResultService } from '../../services/result.service';
import { ResultDisplay, StatisticsResponse } from '../../models/result.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss'
})
export class ResultsComponent implements OnInit, OnDestroy {
  // Backend-connected data
  results: ResultDisplay[] = [];
  filteredResults: ResultDisplay[] = [];
  statistics: StatisticsResponse | null = null;
  availableEventTypes: string[] = [];
  
  // Subscriptions
  private subscriptions = new Subscription();
  
  // Search and filters
  searchTerm = '';
  selectedEventType = '';
  selectedRankRange = '';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  
  isLoading = false;

  constructor(
    private resultService: ResultService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadResults();
    this.loadEventTypes();
    this.loadStatistics();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadResults() {
    this.isLoading = true;
    this.cdr.detectChanges(); // Trigger change detection immediately
    
    this.subscriptions.add(
      this.resultService.getFormattedResults().subscribe({
        next: (results) => {
          console.log('✅ Results page loaded:', results?.length || 0, 'records');
          this.results = results || [];
          this.applyFilters();
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection after data is loaded
        },
        error: (error) => {
          console.error('❌ Error loading results:', error);
          this.results = [];
          this.filteredResults = [];
          this.isLoading = false;
          this.cdr.detectChanges(); // Trigger change detection on error
        }
      })
    );
  }

  private loadEventTypes() {
    this.subscriptions.add(
      this.resultService.getUniqueEventTypes().subscribe({
        next: (eventTypes) => {
          this.availableEventTypes = eventTypes;
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error loading event types:', error);
        }
      })
    );
  }

  private loadStatistics() {
    this.subscriptions.add(
      this.resultService.getStatistics().subscribe({
        next: (stats) => {
          this.statistics = stats;
          this.cdr.detectChanges(); // Trigger change detection
        },
        error: (error) => {
          console.error('Error loading statistics:', error);
        }
      })
    );
  }

  // Filter methods
  applyFilters() {
    this.filteredResults = this.results.filter(result => {
      // Search filter
      const matchesSearch = !this.searchTerm || 
        result.participantName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        result.participantCollege.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        result.eventName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        result.eventType.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        result.conductedBy.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // Event type filter
      const matchesEventType = !this.selectedEventType || 
        result.eventType === this.selectedEventType;
      
      // Rank range filter
      const matchesRankRange = !this.selectedRankRange || this.isInRankRange(result.rank);
      
      return matchesSearch && matchesEventType && matchesRankRange;
    });
    
    // Reset to first page when filters change
    this.currentPage = 1;
  }

  isInRankRange(rank: number): boolean {
    switch (this.selectedRankRange) {
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

  clearSearch() {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchTerm = '';
    this.selectedEventType = '';
    this.selectedRankRange = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.searchTerm || this.selectedEventType || this.selectedRankRange);
  }

  // Pagination methods
  getPaginatedResults(): ResultDisplay[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredResults.slice(start, end);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredResults.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (current < totalPages - 3) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  getPaginationInfo(): string {
    if (this.filteredResults.length === 0) return 'No results';
    
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredResults.length);
    const total = this.filteredResults.length;
    
    return `Showing ${start} - ${end} of ${total} results`;
  }

  // Statistics methods - now using backend statistics
  getTopPerformersCount(): number {
    return this.statistics?.topPerformers || 0;
  }

  getUniqueEventsCount(): number {
    return this.statistics?.eventsCompleted || 0;
  }

  getTotalParticipantsCount(): number {
    return this.statistics?.totalParticipants || 0;
  }

  // Utility methods

  getRankClass(rank: number): string {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'rank-other';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-completed';
    }
  }

  getEventTypeColor(eventType: string): string {
    const colors: { [key: string]: string } = {
      'Technical': '#3A72EC',
      'Cultural': '#F59E0B',
      'Sports': '#10B981',
      'Academic': '#8B5CF6',
      'Competition': '#EF4444'
    };
    return colors[eventType] || '#6B7280';
  }

  getScoreColor(score: number): string {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3A72EC';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  }

  getScorePercentage(score: number): number {
    return Math.min(score, 100);
  }



  getRelativeDate(dateString: string): string {
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
}