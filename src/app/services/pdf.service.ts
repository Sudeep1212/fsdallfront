import { Injectable } from '@angular/core';

export interface TicketData {
  participantId: string;
  participantName: string;
  college: string;
  contact: string;
  email: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  clubName: string;
  eventFee: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generateTicketPDF(ticketData: TicketData): void {
    // Create a simple HTML-based ticket for printing
    const ticketHTML = this.generateTicketHTML(ticketData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(ticketHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing (optional)
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    }
  }

  private generateTicketHTML(ticketData: TicketData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Event Ticket - ${ticketData.participantId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8f9fa;
          padding: 20px;
          color: #333;
        }
        
        .ticket-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          border: 2px solid #e9ecef;
        }
        
        .ticket-header {
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          color: white;
          padding: 25px;
          text-align: center;
          position: relative;
        }
        
        .ticket-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
        }
        
        .event-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .club-name {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 15px;
        }
        
        .admit-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
        }
        
        .ticket-body {
          padding: 30px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 16px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .participant-id {
          text-align: center;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          padding: 20px;
          margin: 20px 0;
          border-radius: 10px;
          border: 2px dashed #9ca3af;
        }
        
        .participant-id-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        
        .participant-id-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }
        
        .participant-id-section {
          text-align: center;
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .fee-section {
          text-align: center;
          margin: 20px 0;
          padding: 20px;
          background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
          border-radius: 12px;
          color: white;
        }
        
        .fee-label {
          font-size: 14px;
          font-weight: 600;
          opacity: 0.9;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .fee-amount {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .instructions {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin-top: 25px;
        }
        
        .instructions-title {
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .instructions-text {
          font-size: 13px;
          color: #b45309;
          line-height: 1.5;
        }
        
        .ticket-footer {
          background: #f9fafb;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .ticket-container {
            box-shadow: none;
            border: 1px solid #000;
          }
        }
        
        @page {
          margin: 0.5in;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="ticket-container">
        
        <!-- Header -->
        <div class="ticket-header">
          <div class="event-title">${ticketData.eventName}</div>
          <div class="club-name">${ticketData.clubName} Presents</div>
          <div class="admit-badge">ADMIT ONE</div>
        </div>
        
        <!-- Body -->
        <div class="ticket-body">
          
          <!-- Participant ID Section -->
          <div class="participant-id-section">
            <div class="participant-id-label">PARTICIPANT ID</div>
            <div class="participant-id-value">${ticketData.participantId}</div>
          </div>
          
          <!-- Participant Details -->
          <div class="section">
            <div class="section-title">Participant Details</div>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Name</div>
                <div class="detail-value">${ticketData.participantName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">College</div>
                <div class="detail-value">${ticketData.college}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Contact</div>
                <div class="detail-value">${ticketData.contact}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Email</div>
                <div class="detail-value">${ticketData.email}</div>
              </div>
            </div>
          </div>
          
          <!-- Event Information -->
          <div class="section">
            <div class="section-title">Event Information</div>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Date</div>
                <div class="detail-value">${ticketData.eventDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Time</div>
                <div class="detail-value">${ticketData.eventTime || '10:00 AM onwards'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Venue</div>
                <div class="detail-value">${ticketData.venue}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Organized by</div>
                <div class="detail-value">${ticketData.clubName}</div>
              </div>
            </div>
          </div>
          
          <!-- Event Fee Highlight -->
          <div class="fee-section">
            <div class="fee-label">Registration Fee</div>
            <div class="fee-amount">${ticketData.eventFee}</div>
          </div>
          
          <!-- Instructions -->
          <div class="instructions">
            <div class="instructions-title">Important Instructions:</div>
            <div class="instructions-text">
              • Please bring this ticket and present it at the venue for entry<br>
              • Payment (if required) should be made in cash at the venue<br>
              • Arrive at least 15 minutes before the event start time<br>
              • Keep your Participant ID safe for future reference
            </div>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div class="ticket-footer">
          Event Management System | Generated on ${new Date().toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        
      </div>
    </body>
    </html>
    `;
  }

  // Alternative method to download as file (if needed)
  downloadTicketAsFile(ticketData: TicketData): void {
    const content = this.generateTicketHTML(ticketData);
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket_${ticketData.participantId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}