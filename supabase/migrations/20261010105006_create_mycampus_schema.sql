/*
# MyCampus - Complete Database Schema

## Overview
Creates the full schema for MyCampus, a campus event management platform with
student, organizer, and admin roles. Includes events, registrations, QR passes,
attendance, certificates, gamification, notifications, feedback, and more.

## New Tables
1. profiles - Extends auth.users with role, name, college, course, year, interests, skills, career goals
2. clubs - College clubs and organizing bodies
3. events - Event listings with full details
4. registrations - Student event registrations with QR pass IDs
5. attendance - Check-in records with timestamps
6. notifications - In-app notification center
7. certificates - Verified certificates
8. feedback - Post-event ratings and reviews
9. preparation_tasks - Pre-event tasks
10. points_transactions - Gamification points
11. announcements - Event updates
12. bookmarks - Saved events
13. audit_logs - Audit trail

## Security
- RLS enabled on all tables with owner-scoped policies using auth.uid()
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'organizer', 'admin')),
  college text DEFAULT '',
  department text DEFAULT '',
  course text DEFAULT '',
  year_of_study text DEFAULT '',
  interests text[] DEFAULT '{}',
  preferred_categories text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  career_goals text DEFAULT '',
  avatar_url text DEFAULT '',
  phone text DEFAULT '',
  leaderboard_visible boolean DEFAULT true,
  onboarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CLUBS
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  club_type text DEFAULT 'technical' CHECK (club_type IN ('technical', 'cultural', 'sports', 'entrepreneurship', 'placement', 'community', 'other')),
  college text DEFAULT '',
  organizer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_clubs" ON clubs;
CREATE POLICY "select_clubs" ON clubs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_clubs" ON clubs;
CREATE POLICY "insert_clubs" ON clubs FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id OR organizer_id IS NULL);
DROP POLICY IF EXISTS "update_clubs" ON clubs;
CREATE POLICY "update_clubs" ON clubs FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);
DROP POLICY IF EXISTS "delete_clubs" ON clubs;
CREATE POLICY "delete_clubs" ON clubs FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'workshop' CHECK (category IN ('hackathon', 'coding', 'ai_ml', 'data_science', 'workshop', 'tech_fest', 'cultural', 'sports', 'entrepreneurship', 'seminar', 'career_fair', 'community')),
  tags text[] DEFAULT '{}',
  skills text[] DEFAULT '{}',
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id uuid REFERENCES clubs(id) ON DELETE SET NULL,
  organizer_name text DEFAULT '',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  registration_deadline timestamptz NOT NULL,
  reporting_time text DEFAULT '',
  venue text DEFAULT '',
  building text DEFAULT '',
  room text DEFAULT '',
  online_link text DEFAULT '',
  event_format text DEFAULT 'offline' CHECK (event_format IN ('offline', 'online', 'hybrid')),
  capacity int DEFAULT 0,
  fee numeric DEFAULT 0,
  eligibility text DEFAULT '',
  agenda text DEFAULT '',
  rules text DEFAULT '',
  banner_url text DEFAULT '',
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'archived', 'completed')),
  certificate_eligible boolean DEFAULT false,
  points_for_registration int DEFAULT 10,
  points_for_attendance int DEFAULT 25,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_events" ON events;
CREATE POLICY "select_events" ON events FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_events" ON events;
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);
DROP POLICY IF EXISTS "update_events" ON events;
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated
USING (auth.uid() = organizer_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (auth.uid() = organizer_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "delete_events" ON events;
CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated
USING (auth.uid() = organizer_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- REGISTRATIONS
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_id text UNIQUE NOT NULL DEFAULT '',
  qr_data text DEFAULT '',
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'waitlisted')),
  is_external boolean DEFAULT false,
  external_link text DEFAULT '',
  notes text DEFAULT '',
  registered_at timestamptz DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_registrations" ON registrations;
CREATE POLICY "select_registrations" ON registrations FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_registrations" ON registrations;
CREATE POLICY "insert_registrations" ON registrations FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_registrations" ON registrations;
CREATE POLICY "update_registrations" ON registrations FOR UPDATE TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "delete_registrations" ON registrations;
CREATE POLICY "delete_registrations" ON registrations FOR DELETE TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = registrations.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at timestamptz DEFAULT now(),
  checked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  method text DEFAULT 'qr' CHECK (method IN ('qr', 'manual')),
  corrected boolean DEFAULT false,
  correction_reason text DEFAULT ''
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_attendance" ON attendance;
CREATE POLICY "select_attendance" ON attendance FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_attendance" ON attendance;
CREATE POLICY "insert_attendance" ON attendance FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "update_attendance" ON attendance;
CREATE POLICY "update_attendance" ON attendance FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "delete_attendance" ON attendance;
CREATE POLICY "delete_attendance" ON attendance FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = attendance.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  type text DEFAULT 'info' CHECK (type IN ('info', 'reminder', 'deadline', 'change', 'cancellation', 'certificate', 'announcement', 'conflict')),
  related_event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_notifications" ON notifications;
CREATE POLICY "select_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_notifications" ON notifications;
CREATE POLICY "update_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_notifications" ON notifications;
CREATE POLICY "delete_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  certificate_type text DEFAULT 'participation' CHECK (certificate_type IN ('participation', 'winner', 'runner_up', 'merit', 'completion')),
  title text NOT NULL DEFAULT '',
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now(),
  file_url text DEFAULT '',
  verified boolean DEFAULT false,
  skills text[] DEFAULT '{}'
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_certificates" ON certificates;
CREATE POLICY "select_certificates" ON certificates FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_certificates" ON certificates;
CREATE POLICY "insert_certificates" ON certificates FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "update_certificates" ON certificates;
CREATE POLICY "update_certificates" ON certificates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "delete_certificates" ON certificates;
CREATE POLICY "delete_certificates" ON certificates FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = certificates.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- FEEDBACK
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  written_feedback text DEFAULT '',
  organization_quality int DEFAULT 5 CHECK (organization_quality >= 1 AND organization_quality <= 5),
  content_quality int DEFAULT 5 CHECK (content_quality >= 1 AND content_quality <= 5),
  overall_experience int DEFAULT 5 CHECK (overall_experience >= 1 AND overall_experience <= 5),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_feedback" ON feedback;
CREATE POLICY "select_feedback" ON feedback FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = feedback.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_feedback" ON feedback;
CREATE POLICY "insert_feedback" ON feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_feedback" ON feedback;
CREATE POLICY "update_feedback" ON feedback FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_feedback" ON feedback;
CREATE POLICY "delete_feedback" ON feedback FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- PREPARATION_TASKS
CREATE TABLE IF NOT EXISTS preparation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  completed boolean DEFAULT false,
  due_date timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE preparation_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_tasks" ON preparation_tasks;
CREATE POLICY "select_tasks" ON preparation_tasks FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM events WHERE events.id = preparation_tasks.event_id AND events.organizer_id = auth.uid()));
DROP POLICY IF EXISTS "insert_tasks" ON preparation_tasks;
CREATE POLICY "insert_tasks" ON preparation_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "update_tasks" ON preparation_tasks;
CREATE POLICY "update_tasks" ON preparation_tasks FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_tasks" ON preparation_tasks;
CREATE POLICY "delete_tasks" ON preparation_tasks FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- POINTS_TRANSACTIONS
CREATE TABLE IF NOT EXISTS points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_points" ON points_transactions;
CREATE POLICY "select_points" ON points_transactions FOR SELECT TO authenticated
USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')));
DROP POLICY IF EXISTS "insert_points" ON points_transactions;
CREATE POLICY "insert_points" ON points_transactions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'organizer')));
DROP POLICY IF EXISTS "delete_points" ON points_transactions;
CREATE POLICY "delete_points" ON points_transactions FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_announcements" ON announcements;
CREATE POLICY "select_announcements" ON announcements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_announcements" ON announcements;
CREATE POLICY "insert_announcements" ON announcements FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = announcements.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "delete_announcements" ON announcements;
CREATE POLICY "delete_announcements" ON announcements FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM events WHERE events.id = announcements.event_id AND events.organizer_id = auth.uid()) OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- BOOKMARKS
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, event_id)
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_bookmarks" ON bookmarks;
CREATE POLICY "select_bookmarks" ON bookmarks FOR SELECT TO authenticated USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "insert_bookmarks" ON bookmarks;
CREATE POLICY "insert_bookmarks" ON bookmarks FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "delete_bookmarks" ON bookmarks;
CREATE POLICY "delete_bookmarks" ON bookmarks FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  performed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_audit_logs" ON audit_logs;
CREATE POLICY "select_audit_logs" ON audit_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_points_student ON points_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_student ON bookmarks(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_event ON feedback(event_id);
CREATE INDEX IF NOT EXISTS idx_announcements_event ON announcements(event_id);

-- UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_profiles_updated ON profiles;
CREATE TRIGGER trigger_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trigger_events_updated ON events;
CREATE TRIGGER trigger_events_updated BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
