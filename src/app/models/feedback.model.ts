export interface Feedback {
  feedbackId?: number;
  dateTime?: string;
  name: string;
  email: string;
  contactNo: string;
  overallEventRating: number;
  orgManagement: number;
  venueFacilities: number;
  techContent: number;
  comments: string;
  registrationId?: number;
}

export interface FeedbackRequest {
  name: string;
  email: string;
  contactNo: string;
  overallEventRating: number;
  orgManagement: number;
  venueFacilities: number;
  techContent: number;
  comments: string;
  registrationId?: number;
}

export interface FeedbackResponse {
  feedbackId: number;
  dateTime: string;
  name: string;
  email: string;
  contactNo: string;
  overallEventRating: number;
  orgManagement: number;
  venueFacilities: number;
  techContent: number;
  comments: string;
  registration?: any;
}