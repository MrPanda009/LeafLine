export type UserRole = 'admin' | 'citizen' | 'authority'
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'rejected' | 'duplicate'
export type SeverityLevel = 'L1' | 'L2' | 'L3' | 'L4'

export interface Profile {
  id: string
  email: string
  role: UserRole
  aadhar_hash?: string
  kyc_verified?: boolean
  is_blocked?: boolean
  spam_strikes?: number
  house_no?: string
  colony_name?: string
  pincode?: string
  map_lngh?: string
  phone_number?: string
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  description?: string
  parent_id?: string | null
  created_at: string
}

export interface Complaint {
  id: string
  reporter_id: string
  title: string
  description: string
  category_id: string
  severity: SeverityLevel
  status: ComplaintStatus
  location: string // PostGIS geography point
  digipin_code: string
  media_urls?: string[]
  upvote_count?: number
  assigned_to?: string
  resolved_at?: string
  created_at: string
  updated_at: string
  // Relations
  category?: Category
  reporter?: Profile
}

export interface Upvote {
  id: string
  complaint_id: string
  user_id: string
  created_at: string
}

export interface Review {
  id: string
  complaint_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
}

export interface TicketHistory {
  id: string
  complaint_id: string
  changed_by: string
  old_status?: ComplaintStatus
  new_status: ComplaintStatus
  comment?: string
  created_at: string
}

export interface DuplicateCheckResult {
  id: string
  title: string
  description: string
  distance_meters: number
  created_at: string
  upvote_count: number
}
