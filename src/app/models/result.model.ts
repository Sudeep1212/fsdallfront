// Results and related entities models matching backend structure exactly

export interface Registration {
  registrationId: number;
  name: string;
  college: string;
  email: string;
  contact: string;
}

export interface Participation {
  participationId: number;
  registration: Registration;
  event: BackendEvent;
  eventAmount: number;
  result?: Result;
}

export interface Venue {
  venue_id: number;
  name: string;
  floor: number;
}

export interface Club {
  club_id: number;
  name: string;
  presidentName: string;
  presidentContact: string;
  presidentEmail: string;
}

export interface Judge {
  judge_id: number;
  judge_name: string;
}

export interface BackendEvent {
  event_id: number;
  event_name: string;
  event_start_date: string;
  event_end_date: string;
  event_time: string;
  event_type: string;
  event_description: string;
  judge_id: number;
  club_id: number;
  venue_id: number;
  venue?: Venue;
  club?: Club;
  judge?: Judge;
}

export interface Result {
  resultId: number;
  rank: number;
  score: number;
  event: BackendEvent;
  participation: Participation;
}

// Frontend display interface for results table
export interface ResultDisplay {
  resultId: number;
  rank: number;
  participantId: string; // Formatted as 'STU' + participationId
  participantName: string;
  participantInitials: string;
  participantCollege: string; // College name from registration
  eventName: string;
  eventType: string;
  eventStartDate: string;
  eventEndDate: string;
  daysAgo: string;
  score: number;
  scorePercentage: number;
  conductedBy: string; // Club name
}

// API Response interfaces
export interface ResultsResponse {
  results: Result[];
  totalCount: number;
}

export interface StatisticsResponse {
  topPerformers: number;
  eventsCompleted: number;
  totalParticipants: number;
}