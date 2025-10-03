export interface Event {
  event_id: number;
  event_name: string;
  event_start_date: string;
  event_end_date: string;
  event_time: string;
  event_type: string;
  event_description: string;
  judge_id?: number;
  club_id?: number;
  venue_id?: number;
  
  // Related entities (from backend relationships)
  venue?: Venue;
  club?: Club;
  judge?: Judge;
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
