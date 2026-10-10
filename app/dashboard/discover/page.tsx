'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase, EventItem, Bookmark } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Clock, Users, Bookmark as BookmarkIcon, Calendar, Filter, X, Sparkles } from 'lucide-react';
import { CATEGORIES, CATEGORY_LABELS, EVENT_FORMAT_LABELS, formatINR, getCountdown, formatDate, getDaysUntil } from '@/lib/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DiscoverPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [format, setFormat] = useState('all');
  const [feeFilter, setFeeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
    if (profile) loadBookmarks();
  }, [profile]);

  const loadEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .in('status', ['published', 'completed'])
      .order('start_date', { ascending: true });
    setEvents(data as EventItem[] || []);
    setLoading(false);
  };

  const loadBookmarks = async () => {
    if (!profile) return;
    const { data } = await supabase.from('bookmarks').select('event_id').eq('student_id', profile.id);
    setBookmarks((data as Bookmark[])?.map((b) => b.event_id) || []);
  };

  const toggleBookmark = async (eventId: string) => {
    if (!profile) return;
    if (bookmarks.includes(eventId)) {
      await supabase.from('bookmarks').delete().eq('student_id', profile.id).eq('event_id', eventId);
      setBookmarks(bookmarks.filter((id) => id !== eventId));
      toast.success('Bookmark removed');
    } else {
      await supabase.from('bookmarks').insert({ student_id: profile.id, event_id: eventId });
      setBookmarks([...bookmarks, eventId]);
      toast.success('Event bookmarked');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (search) {
        const q = search.toLowerCase();
        if (!event.title.toLowerCase().includes(q) &&
            !event.description.toLowerCase().includes(q) &&
            !event.tags.some((t) => t.toLowerCase().includes(q)) &&
            !event.skills.some((s) => s.toLowerCase().includes(q))) return false;
      }
      if (category !== 'all' && event.category !== category) return false;
      if (format !== 'all' && event.event_format !== format) return false;
      if (feeFilter === 'free' && event.fee > 0) return false;
      if (feeFilter === 'paid' && event.fee === 0) return false;
      return true;
    });
  }, [events, search, category, format, feeFilter]);

  const clearFilters = () => {
    setSearch(''); setCategory('all'); setFormat('all'); setFeeFilter('all');
  };

  const hasActiveFilters = search || category !== 'all' || format !== 'all' || feeFilter !== 'all';

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> Discover Events
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Find hackathons, workshops, competitions, and more on your campus.</p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search events, skills, tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-lg border border-border bg-card/50">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="offline">On-Campus</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={feeFilter} onValueChange={setFeeFilter}>
              <SelectTrigger><SelectValue placeholder="Fee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="free">Free Only</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 rounded-xl bg-card/50 animate-pulse" />)}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No events match your filters.</p>
            {hasActiveFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const daysUntil = getDaysUntil(event.registration_deadline);
            const isBookmarked = bookmarks.includes(event.id);
            const isPast = new Date(event.start_date) < new Date();
            return (
              <Card key={event.id} className="bg-card/50 border-border hover:border-primary/30 transition-all hover:translate-y-[-2px] group flex flex-col">
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[event.category] || event.category}</Badge>
                    <button onClick={() => toggleBookmark(event.id)} className="text-muted-foreground hover:text-primary transition-colors">
                      <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
                    </button>
                  </div>

                  <Link href={`/dashboard/events/${event.id}`} className="flex-1">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                  </Link>

                  <div className="space-y-2 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(event.start_date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {event.venue || 'TBA'} · {EVENT_FORMAT_LABELS[event.event_format]}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> {event.organizer_name || 'Campus Club'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <span className="text-sm font-semibold">{formatINR(event.fee)}</span>
                      {event.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {event.tags.slice(0, 2).map((tag) => <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {isPast ? (
                        <Badge variant="secondary" className="text-xs">Past Event</Badge>
                      ) : daysUntil > 0 ? (
                        <>
                          <p className="text-xs text-primary font-medium">{getCountdown(event.start_date)}</p>
                          <p className="text-[10px] text-muted-foreground">to start</p>
                        </>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Registration Closed</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
