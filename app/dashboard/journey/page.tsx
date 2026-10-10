'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase, EventItem, Registration, PreparationTask } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar, Clock, MapPin, AlertTriangle, QrCode, ArrowRight, Route,
  ListTodo, CheckCircle2, Circle, ExternalLink, Plus, Filter, Building, Megaphone,
  Award, Trophy, X,
} from 'lucide-react';
import { CATEGORY_LABELS, EVENT_FORMAT_LABELS, formatDate, formatDateTime, getCountdown, getDaysUntil, eventsOverlap } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function JourneyPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tasks, setTasks] = useState<PreparationTask[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showExternalModal, setShowExternalModal] = useState(false);

  // External event form
  const [extTitle, setExtTitle] = useState('');
  const [extStartDate, setExtStartDate] = useState('');
  const [extEndDate, setExtEndDate] = useState('');
  const [extVenue, setExtVenue] = useState('');
  const [extLink, setExtLink] = useState('');
  const [extNotes, setExtNotes] = useState('');

  useEffect(() => { if (profile) loadData(); }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    const { data: regs } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('student_id', profile.id)
      .order('registered_at', { ascending: false });
    setRegistrations(regs as unknown as Registration[] || []);

    const { data: taskData } = await supabase
      .from('preparation_tasks')
      .select('*')
      .eq('student_id', profile.id)
      .order('due_date', { ascending: true });
    setTasks(taskData as PreparationTask[] || []);

    // Get announcements for registered events
    const eventIds = (regs as unknown as Registration[])?.map((r) => r.event_id).filter(Boolean) || [];
    if (eventIds.length > 0) {
      const { data: anns } = await supabase
        .from('announcements')
        .select('*, event:events(title)')
        .in('event_id', eventIds)
        .order('created_at', { ascending: false })
        .limit(5);
      setAnnouncements(anns || []);
    }
    setLoading(false);
  };

  const conflicts = useMemo(() => {
    const active = registrations.filter((r) => r.event && r.status === 'registered');
    const conflicts: Array<{ r1: Registration; r2: Registration }> = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (eventsOverlap(active[i].event!, active[j].event!)) {
          conflicts.push({ r1: active[i], r2: active[j] });
        }
      }
    }
    return conflicts;
  }, [registrations]);

  const filtered = useMemo(() => {
    let result = registrations.filter((r) => r.status !== 'cancelled');
    if (filter !== 'all') result = result.filter((r) => r.event?.category === filter);
    if (statusFilter === 'upcoming') result = result.filter((r) => r.event && new Date(r.event.start_date) > new Date());
    if (statusFilter === 'past') result = result.filter((r) => r.event && new Date(r.event.end_date) < new Date());
    if (statusFilter === 'today') {
      const now = new Date();
      result = result.filter((r) => {
        if (!r.event) return false;
        const start = new Date(r.event.start_date);
        const end = new Date(r.event.end_date);
        return start <= now && end >= now;
      });
    }
    return result.sort((a, b) => {
      if (!a.event || !b.event) return 0;
      return new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime();
    });
  }, [registrations, filter, statusFilter]);

  const deadlines = useMemo(() => {
    return registrations
      .filter((r) => r.event && new Date(r.event.registration_deadline) > new Date())
      .sort((a, b) => new Date(a.event!.registration_deadline).getTime() - new Date(b.event!.registration_deadline).getTime())
      .slice(0, 5);
  }, [registrations]);

  const addExternalEvent = async () => {
    if (!profile || !extTitle || !extStartDate) {
      toast.error('Title and start date are required');
      return;
    }
    const regId = `EXT-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase.from('registrations').insert({
      student_id: profile.id,
      registration_id: regId,
      qr_data: regId,
      status: 'registered',
      is_external: true,
      external_link: extLink,
      notes: `${extVenue}\n${extNotes}`,
      registered_at: new Date().toISOString(),
    }).select('*').single();

    if (error) { toast.error('Failed to add external event'); return; }

    // Create a minimal event entry linked to this registration
    // Since external events don't have a real event_id, we store details in notes
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'External Event Added',
      message: `${extTitle} added to your journey. Manually tracked.`,
      type: 'info',
    });

    toast.success('External event added to your journey');
    setShowExternalModal(false);
    setExtTitle(''); setExtStartDate(''); setExtEndDate(''); setExtVenue(''); setExtLink(''); setExtNotes('');
    loadData();
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from('preparation_tasks').update({ completed: !completed }).eq('id', taskId);
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, completed: !completed } : t));
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-card/50" />
          <div className="h-64 rounded-xl bg-card/50 animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Route className="w-6 h-6 text-primary" /> My Journey</h1>
          <p className="text-muted-foreground text-sm mt-1">Your unified event timeline — every detail in one place.</p>
        </div>
        <Button onClick={() => setShowExternalModal(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add External Event
        </Button>
      </div>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Scheduling Conflict Detected</p>
                <div className="mt-2 space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{c.r1.event?.title}</span> overlaps with{' '}
                      <span className="font-medium">{c.r2.event?.title}</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(c.r1.event!.start_date)} — {formatDateTime(c.r1.event!.end_date)}{' '}
                        <span className="mx-1">vs</span> {' '}
                        {formatDateTime(c.r2.event!.start_date)} — {formatDateTime(c.r2.event!.end_date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="today">Happening Today</SelectItem>
            <SelectItem value="past">Past Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
        </TabsList>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-4">
          {filtered.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-12 text-center">
                <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No events in your journey yet.</p>
                <Link href="/dashboard/discover"><Button className="bg-gradient-brand hover:opacity-90">Discover Events</Button></Link>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {filtered.map((reg) => {
                  if (!reg.event && !reg.is_external) return null;
                  const event = reg.event;
                  const isExternal = reg.is_external;
                  const isPast = event ? new Date(event.end_date) < new Date() : false;
                  const isUpcoming = event ? new Date(event.start_date) > new Date() : true;

                  return (
                    <div key={reg.id} className="relative pl-12">
                      <div className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        isPast ? 'border-muted bg-muted/20' : isUpcoming ? 'border-primary bg-primary/10' : 'border-warning bg-warning/10'
                      }`}>
                        {isPast ? <CheckCircle2 className="w-4 h-4 text-muted-foreground" /> : isUpcoming ? <Calendar className="w-4 h-4 text-primary" /> : <Clock className="w-4 h-4 text-warning" />}
                      </div>

                      <Card className="bg-card/50 border-border hover:border-primary/20 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {event && <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[event.category]}</Badge>}
                                {isExternal && <Badge variant="outline" className="text-xs text-warning border-warning/30">External</Badge>}
                                {reg.status === 'cancelled' && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
                              </div>
                              <Link href={event ? `/dashboard/events/${event.id}` : '#'}>
                                <h3 className="font-semibold hover:text-primary transition-colors">{event?.title || extTitle}</h3>
                              </Link>
                              {isExternal && reg.notes && <p className="text-xs text-muted-foreground mt-1">{reg.notes.split('\n')[0]}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              {isUpcoming && event && <p className="text-xs text-primary font-medium">{getCountdown(event.start_date)}</p>}
                              {isPast && <Badge variant="secondary" className="text-xs">Completed</Badge>}
                            </div>
                          </div>

                          {event && (
                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {formatDate(event.start_date)} — {formatDate(event.end_date)}</div>
                              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {formatDateTime(event.start_date)}</div>
                              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {event.venue || 'TBA'} · {EVENT_FORMAT_LABELS[event.event_format]}</div>
                              <div className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> {event.organizer_name}</div>
                              {event.reporting_time && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-warning" /> Report by {event.reporting_time}</div>}
                              {event.online_link && <div className="flex items-center gap-2"><Building className="w-3.5 h-3.5" /> <a href={event.online_link} target="_blank" className="text-primary hover:underline">Online Link</a></div>}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">Reg ID: <span className="font-mono">{reg.registration_id}</span></span>
                            {isExternal && reg.external_link && (
                              <a href={reg.external_link} target="_blank" className="text-xs text-primary hover:underline flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> Event Link
                              </a>
                            )}
                            {event && (
                              <Link href={`/dashboard/events/${event.id}`} className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto">
                                Details <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {filtered.length === 0 ? (
            <Card className="bg-card/50 border-border">
              <CardContent className="p-12 text-center">
                <p className="text-sm text-muted-foreground">No events to display.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((reg) => {
                if (!reg.event && !reg.is_external) return null;
                const event = reg.event;
                const isPast = event ? new Date(event.end_date) < new Date() : false;
                return (
                  <Card key={reg.id} className="bg-card/50 border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                      {event && (
                        <div className="w-14 h-14 rounded-lg bg-gradient-brand-subtle flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-primary font-semibold">{format(parseISO(event.start_date), 'MMM').toUpperCase()}</span>
                          <span className="text-lg font-bold text-primary">{format(parseISO(event.start_date), 'dd')}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{event?.title || extTitle}</p>
                          {reg.is_external && <Badge variant="outline" className="text-xs text-warning">External</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event ? `${formatDateTime(event.start_date)} · ${event.venue || 'TBA'}` : reg.notes}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {isPast ? <Badge variant="secondary">Past</Badge> :
                          event ? <>
                            <p className="text-xs text-primary font-medium">{getCountdown(event.start_date)}</p>
                            <p className="text-[10px] text-muted-foreground">{getDaysUntil(event.start_date)} days</p>
                          </> : null}
                      </div>
                      {event && (
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Button variant="ghost" size="icon"><ArrowRight className="w-4 h-4" /></Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Deadlines View */}
        <TabsContent value="deadlines" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Registration Deadlines</CardTitle></CardHeader>
              <CardContent>
                {deadlines.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No upcoming deadlines.</p>
                ) : (
                  <div className="space-y-3">
                    {deadlines.map((reg) => {
                      const days = getDaysUntil(reg.event!.registration_deadline);
                      return (
                        <Link key={reg.id} href={`/dashboard/events/${reg.event_id}`}>
                          <div className="p-3 rounded-lg border border-border hover:border-primary/30 transition-all">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium truncate">{reg.event!.title}</p>
                              <Badge variant={days <= 2 ? 'destructive' : 'secondary'} className="text-xs">{days}d left</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDateTime(reg.event!.registration_deadline)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListTodo className="w-5 h-5 text-primary" /> Pending Tasks</CardTitle></CardHeader>
              <CardContent>
                {tasks.filter((t) => !t.completed).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No pending tasks. You're all caught up!</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.filter((t) => !t.completed).map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <button onClick={() => toggleTask(task.id, false)} className="shrink-0">
                          <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                        </button>
                        <span className="text-sm flex-1">{task.title}</span>
                        {task.due_date && <Badge variant="secondary" className="text-xs">{getDaysUntil(task.due_date)}d</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {announcements.length > 0 && (
            <Card className="bg-card/50 border-border mt-6">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Recent Announcements</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{ann.title}</p>
                      <span className="text-xs text-muted-foreground">{ann.event?.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ann.message}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">{formatDateTime(ann.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* External Event Modal */}
      <Dialog open={showExternalModal} onOpenChange={setShowExternalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add External Event</DialogTitle>
            <DialogDescription>Track an event you registered for elsewhere. It will be labeled as externally tracked.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Event Title *</Label>
              <Input placeholder="e.g., Smart India Hackathon" value={extTitle} onChange={(e) => setExtTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" value={extStartDate} onChange={(e) => setExtStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={extEndDate} onChange={(e) => setExtEndDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Venue / Location</Label>
              <Input placeholder="e.g., Bangalore Convention Center" value={extVenue} onChange={(e) => setExtVenue(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Registration Link</Label>
              <Input placeholder="https://..." value={extLink} onChange={(e) => setExtLink(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Any additional details..." value={extNotes} onChange={(e) => setExtNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowExternalModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={addExternalEvent} className="flex-1 bg-gradient-brand hover:opacity-90">Add to Journey</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
