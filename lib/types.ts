export const CATEGORIES = [
  { value: 'hackathon', label: 'Hackathons', icon: 'Trophy' },
  { value: 'coding', label: 'Coding Competitions', icon: 'Code' },
  { value: 'ai_ml', label: 'AI & Machine Learning', icon: 'BrainCircuit' },
  { value: 'data_science', label: 'Data Science', icon: 'BarChart3' },
  { value: 'workshop', label: 'Workshops', icon: 'Wrench' },
  { value: 'tech_fest', label: 'Technical Fests', icon: 'Cpu' },
  { value: 'cultural', label: 'Cultural Events', icon: 'Music' },
  { value: 'sports', label: 'Sports', icon: 'Medal' },
  { value: 'entrepreneurship', label: 'Entrepreneurship', icon: 'Rocket' },
  { value: 'seminar', label: 'Seminars & Conferences', icon: 'Presentation' },
  { value: 'career_fair', label: 'Career Fairs', icon: 'Briefcase' },
  { value: 'community', label: 'Community & Social Impact', icon: 'HeartHandshake' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export const SKILL_OPTIONS = [
  'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++',
  'Machine Learning', 'Deep Learning', 'Data Analysis', 'UI/UX Design',
  'Cloud Computing', 'DevOps', 'Cybersecurity', 'Blockchain', 'Mobile Development',
  'Web Development', 'AI', 'NLP', 'Computer Vision', 'Statistics', 'SQL',
  'Leadership', 'Public Speaking', 'Team Management', 'Marketing', 'Finance',
];

export const INTEREST_OPTIONS = [
  'Technology', 'AI & ML', 'Coding', 'Data Science', 'Entrepreneurship',
  'Design', 'Research', 'Sports', 'Music', 'Dance', 'Drama', 'Photography',
  'Social Impact', 'Finance', 'Marketing', 'Consulting', 'Product Management',
];

export const EVENT_FORMAT_LABELS: Record<string, string> = {
  offline: 'On-Campus',
  online: 'Online',
  hybrid: 'Hybrid',
};

export const BADGES = [
  { id: 'event_explorer', name: 'Event Explorer', description: 'Registered for 5+ events', icon: 'Compass', threshold: 5 },
  { id: 'tech_enthusiast', name: 'Tech Enthusiast', description: 'Attended 3+ tech events', icon: 'Cpu', threshold: 3 },
  { id: 'active_participant', name: 'Active Participant', description: 'Attended 10+ events', icon: 'Users', threshold: 10 },
  { id: 'hackathon_hunter', name: 'Hackathon Hunter', description: 'Attended 2+ hackathons', icon: 'Trophy', threshold: 2 },
];

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] || value;
}

export function formatINR(amount: number): string {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCountdown(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  
  if (diff < 0) return 'Started / Past';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function eventsOverlap(e1: { start_date: string; end_date: string }, e2: { start_date: string; end_date: string }): boolean {
  const s1 = new Date(e1.start_date).getTime();
  const e1End = new Date(e1.end_date).getTime();
  const s2 = new Date(e2.start_date).getTime();
  const e2End = new Date(e2.end_date).getTime();
  return s1 < e2End && s2 < e1End;
}

export function generateRegistrationId(): string {
  const prefix = 'MC';
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const time = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}-${time}-${random}`;
}
