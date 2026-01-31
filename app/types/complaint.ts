export type ComplaintStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface TicketHistory {
  status: ComplaintStatus;
  changed_by: string;
  notes: string | null;
  changed_at: string;
}

export interface Complaint {
  id: string;
  reporter_id: string;
  description: string;
  status: ComplaintStatus;
  location: string | null;
  media_urls: string[];
  severity: number;
  category_id: string;
  raised_at: string;
  resolved_at?: string | null;

  // Joins / computed
  upvotes?: number;
  ticket_history?: TicketHistory[];
}
