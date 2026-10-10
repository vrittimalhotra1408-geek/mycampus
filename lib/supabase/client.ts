import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'organizer' | 'admin';
  college: string;
  department: string;
  course: string;
  year_of_study: string;
  interests: string[];
  preferred_categories: string[];
  skills: string[];
  career_goals: string;
  avatar_url: string;
  phone: string;
  leaderboard_visible: boolean;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type Club = {
  id: string;
  name: string;
  description: string;
  club_type: string;
  college: string;
  organizer_id: string | null;
  created_at: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  skills: string[];
  organizer_id: string;
  club_id: string | null;
  organizer_name: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  reporting_time: string;
  venue: string;
  building: string;
  room: string;
  online_link: string;
  event_format: 'offline' | 'online' | 'hybrid';
  capacity: number;
  fee: number;
  eligibility: string;
  agenda: string;
  rules: string;
  banner_url: string;
  status: 'draft' | 'published' | 'cancelled' | 'archived' | 'completed';
  certificate_eligible: boolean;
  points_for_registration: number;
  points_for_attendance: number;
  created_at: string;
  updated_at: string;
};

export type Registration = {
  id: string;
  event_id: string;
  student_id: string;
  registration_id: string;
  qr_data: string;
  status: 'registered' | 'cancelled' | 'waitlisted';
  is_external: boolean;
  external_link: string;
  notes: string;
  registered_at: string;
  cancelled_at: string | null;
  created_at: string;
  event?: EventItem;
};

export type AttendanceRecord = {
  id: string;
  registration_id: string;
  event_id: string;
  student_id: string;
  checked_in_at: string;
  checked_by: string | null;
  method: 'qr' | 'manual';
  corrected: boolean;
  correction_reason: string;
};

export type NotificationItem = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_event_id: string | null;
  read: boolean;
  created_at: string;
};

export type Certificate = {
  id: string;
  student_id: string;
  event_id: string;
  certificate_type: string;
  title: string;
  issued_by: string | null;
  issued_at: string;
  file_url: string;
  verified: boolean;
  skills: string[];
  event?: EventItem;
};

export type FeedbackItem = {
  id: string;
  event_id: string;
  student_id: string;
  rating: number;
  written_feedback: string;
  organization_quality: number;
  content_quality: number;
  overall_experience: number;
  created_at: string;
};

export type PreparationTask = {
  id: string;
  event_id: string | null;
  student_id: string;
  title: string;
  description: string;
  completed: boolean;
  due_date: string | null;
  created_at: string;
};

export type PointsTransaction = {
  id: string;
  student_id: string;
  event_id: string | null;
  points: number;
  reason: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  event_id: string;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  student_id: string;
  event_id: string;
  created_at: string;
};
