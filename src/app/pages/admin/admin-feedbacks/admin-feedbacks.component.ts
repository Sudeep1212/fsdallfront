import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';

interface Feedback {
  feedbackId?: number;
  dateTime: string;
  name: string;
  email: string;
  contactNo: string;
  overallEventRating: number;
  orgManagement: number;
  venueFacilities: number;
  techContent: number;
  comments: string;
}

@Component({
  selector: 'app-admin-feedbacks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-feedbacks.component.html',
  styleUrl: './admin-feedbacks.component.scss'
})
export class AdminFeedbacksComponent implements OnInit {
  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];
  searchTerm: string = '';
  
  showDeleteModal = false;
  selectedFeedbackId: number | null = null;
  loading = false;
  exporting = false;
  
  toastMessage = '';
  showSuccessToast = false;
  showErrorToast = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('=== Feedbacks Component Initialized ===');
    this.loadFeedbacks();
  }

  async loadFeedbacks() {
    try {
      this.feedbacks = await this.http.get<Feedback[]>(`${this.apiUrl}/feedbacks`).toPromise() || [];
      console.log('Loaded feedbacks:', this.feedbacks);
      this.filteredFeedbacks = [...this.feedbacks];
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading feedbacks:', error);
    }
  }

  filterFeedbacks() {
    const term = this.searchTerm.toLowerCase().trim();
    
    if (!term) {
      this.filteredFeedbacks = [...this.feedbacks];
      return;
    }

    this.filteredFeedbacks = this.feedbacks.filter(feedback =>
      feedback.name.toLowerCase().includes(term) ||
      feedback.email.toLowerCase().includes(term) ||
      feedback.contactNo.toLowerCase().includes(term) ||
      feedback.comments.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterFeedbacks();
  }

  get totalFeedbacks(): number {
    return this.feedbacks.length;
  }

  get activeFeedbacks(): number {
    return this.filteredFeedbacks.length;
  }

  get averageRating(): number {
    if (this.feedbacks.length === 0) return 0;
    const sum = this.feedbacks.reduce((acc, feedback) => acc + feedback.overallEventRating, 0);
    return sum / this.feedbacks.length;
  }

  // Export to Excel functionality
  exportToExcel() {
    if (this.feedbacks.length === 0) {
      this.showErrorMessage('No feedbacks available to export');
      return;
    }

    try {
      this.exporting = true;
      console.log('Starting Excel export...');

      // Prepare data for Excel
      const exportData = this.feedbacks.map((feedback, index) => ({
        'Sr. No.': index + 1,
        'Name': feedback.name,
        'Email': feedback.email,
        'Contact': feedback.contactNo,
        'Overall Rating': feedback.overallEventRating,
        'Organization': feedback.orgManagement,
        'Venue': feedback.venueFacilities,
        'Tech Content': feedback.techContent,
        'Comments': feedback.comments || 'N/A',
        'Submitted At': feedback.dateTime ? new Date(feedback.dateTime).toLocaleString() : 'N/A'
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // Sr. No.
        { wch: 20 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Contact
        { wch: 12 }, // Overall Rating
        { wch: 12 }, // Organization
        { wch: 12 }, // Venue
        { wch: 12 }, // Tech Content
        { wch: 40 }, // Comments
        { wch: 20 }  // Submitted At
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedbacks');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `Feedbacks_Export_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      console.log('Excel export completed:', filename);
      this.exporting = false;
      
      // Show success toast
      this.toastMessage = `Exported ${this.feedbacks.length} feedbacks to Excel successfully!`;
      this.showSuccessToast = true;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.exporting = false;
      this.showErrorMessage('Failed to export feedbacks to Excel');
    }
  }

  openDeleteModal(feedbackId: number) {
    this.selectedFeedbackId = feedbackId;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedFeedbackId = null;
  }

  async confirmDelete() {
    if (!this.selectedFeedbackId) return;
    
    this.loading = true;
    this.cdr.detectChanges();
    
    try {
      await this.http.delete(`${this.apiUrl}/feedbacks/${this.selectedFeedbackId}`, { responseType: 'text' }).toPromise();
      
      await this.loadFeedbacks();
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedFeedbackId = null;
      this.cdr.detectChanges();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.toastMessage = 'Feedback deleted successfully!';
      this.showSuccessToast = true;
      console.log('Toast state:', this.showSuccessToast, 'Message:', this.toastMessage);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        console.log('Hiding toast...');
        this.showSuccessToast = false;
        this.cdr.detectChanges();
      }, 3000);
      
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      this.loading = false;
      this.showDeleteModal = false;
      this.selectedFeedbackId = null;
      this.cdr.detectChanges();
      this.showErrorMessage('Failed to delete feedback.');
    }
  }

  showErrorMessage(message: string): void {
    this.toastMessage = message;
    this.showErrorToast = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.showErrorToast = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
