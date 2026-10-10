'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase, EventItem, Registration, Announcement, PreparationTask } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Calendar, Clock, MapPin, Users, Trophy, ArrowLeft, QrCode, CheckCircle2,
  AlertCircle, Building, Tag, Award, Megaphone, ListTodo, Plus, Download, X,
} from 'lucide-react';
import { CATEGORY_LABELS, EVENT_FORMAT_LABELS, formatINR, formatDateTime, formatDate, getCountdown, getDaysUntil, generateRegistrationId } from '@/lib/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tasks, setTasks] = useState<PreparationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [regCount, setRegCount] = useState(0);
  const [hasAttended, setHasAttended] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id, profile]);

  const loadData = async () => {
    setLoading(true);
    const { data: ev } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    setEvent(ev as EventItem | null);

    if (profile) {
      const { data: reg } = await supabase
        .from('registrations')
        .select('*')
        .eq('event_id', id)
        .eq('student_id', profile.id)
        .neq('status', 'cancelled')
        .maybeSingle();
      setRegistration(reg as Registration | null);

      if (reg) {
        const { data: att } = await supabase
          .from('attendance')
          .select('*')
          .eq('registration_id', reg.id)
          .maybeSingle();
        setHasAttended(!!att);
      }

      const { data: taskData } = await supabase
        .from('preparation_tasks')
        .select('*')
        .eq('student_id', profile.id)
        .eq('event_id', id)
        .order('created_at', { ascending: true });
      setTasks(taskData as PreparationTask[] || []);
    }

    const { data: anns } = await supabase
      .from('announcements')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false });
    setAnnouncements(anns as Announcement[] || []);

    const { count } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'registered');
    setRegCount(count || 0);
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!profile || !event) return;
    if (profile.role !== 'student') {
      toast.error('Only students can register for events');
      return;
    }
    const now = new Date();
    if (new Date(event.registration_deadline) < now) {
      toast.error('Registration deadline has passed');
      return;
    }
    if (event.capacity > 0 && regCount >= event.capacity) {
      toast.error('Event is at full capacity');
      return;
    }

    setRegistering(true);
    const regId = generateRegistrationId();
    const qrData = JSON.stringify({ reg_id: regId, event_id: event.id, student_id: profile.id });

    const { data, error } = await supabase.from('registrations').insert({
      event_id: event.id,
      student_id: profile.id,
      registration_id: regId,
      qr_data: qrData,
      status: 'registered',
    }).select('*').single();

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'You are already registered' : 'Registration failed');
      setRegistering(false);
      return;
    }

    // Award registration points
    await supabase.from('points_transactions').insert({
      student_id: profile.id,
      event_id: event.id,
      points: event.points_for_registration,
      reason: `Registered for ${event.title}`,
    });

    // Create notification
    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Registration Confirmed',
      message: `You're registered for ${event.title}. Event starts on ${formatDate(event.start_date)}.`,
      type: 'info',
      related_event_id: event.id,
    });

    setRegistration(data as Registration);
    setRegCount(regCount + 1);
    setShowQR(true);
    setRegistering(false);
    toast.success('Registration confirmed! Your QR pass is ready.');
  };

  const handleCancel = async () => {
    if (!registration || !profile) return;
    const { error } = await supabase
      .from('registrations')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', registration.id);

    if (error) { toast.error('Failed to cancel'); return; }

    await supabase.from('notifications').insert({
      user_id: profile.id,
      title: 'Registration Cancelled',
      message: `Your registration has been cancelled.`,
      type: 'cancellation',
      related_event_id: event?.id,
    });

    setRegistration(null);
    setRegCount(regCount - 1);
    toast.success('Registration cancelled');
  };

  const addTask = async () => {
    if (!newTask.trim() || !profile || !event) return;
    const { data } = await supabase.from('preparation_tasks').insert({
      student_id: profile.id,
      event_id: event.id,
      title: newTask.trim(),
    }).select('*').single();
    if (data) setTasks([...tasks, data as PreparationTask]);
    setNewTask('');
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await supabase.from('preparation_tasks').update({ completed: !completed }).eq('id', taskId);
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, completed: !completed } : t));
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <div className="h-8 w-32 animate-pulse rounded bg-card/50" />
          <div className="h-48 rounded-xl bg-card/50 animate-pulse" />
          <div className="h-64 rounded-xl bg-card/50 animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  if (!event) {
    return (
      <DashboardShell>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Event not found.</p>
            <Link href="/dashboard/discover"><Button variant="outline" className="mt-4">Back to Discover</Button></Link>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const isPast = new Date(event.end_date) < new Date();
  const regOpen = new Date(event.registration_deadline) > new Date() && event.status === 'published';
  const seatsLeft = event.capacity > 0 ? event.capacity - regCount : 0;

  return (
    <DashboardShell>
      <Link href="/dashboard/discover" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Discover
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Header */}
          <Card className="bg-card/50 border-border overflow-hidden">
            {event.banner_url && (
              <div className="h-48 bg-gradient-brand-subtle relative">
                <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            {!event.banner_url && (
              <div className="h-32 bg-gradient-brand-subtle flex items-center justify-center">
                <Trophy className="w-12 h-12 text-primary/30" />
              </div>
            )}
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{CATEGORY_LABELS[event.category] || event.category}</Badge>
                    <Badge variant="outline">{EVENT_FORMAT_LABELS[event.event_format]}</Badge>
                    {event.certificate_eligible && <Badge className="bg-warning/20 text-warning"><Award className="w-3 h-3 mr-1" /> Certificate</Badge>}
                    {isPast && <Badge variant="secondary">Past Event</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {event.organizer_name || 'Campus Club'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-primary">{formatINR(event.fee)}</p>
                  {event.capacity > 0 && <p className="text-xs text-muted-foreground">{seatsLeft} seats left</p>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>

              {event.tags.length > 0 && (
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {event.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              )}
              {event.skills.length > 0 && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">Skills:</span>
                  {event.skills.map((skill) => <Badge key={skill} variant="outline" className="text-xs text-accent border-accent/30">{skill}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agenda */}
          {event.agenda && (
            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-lg">Agenda</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{event.agenda}</pre>
              </CardContent>
            </Card>
          )}

          {/* Eligibility & Rules */}
          <div className="grid md:grid-cols-2 gap-4">
            {event.eligibility && (
              <Card className="bg-card/50 border-border">
                <CardHeader><CardTitle className="text-base">Eligibility</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">{event.eligibility}</p></CardContent>
              </Card>
            )}
            {event.rules && (
              <Card className="bg-card/50 border-border">
                <CardHeader><CardTitle className="text-base">Rules</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.rules}</p></CardContent>
              </Card>
            )}
          </div>

          {/* Announcements */}
          {announcements.length > 0 && (
            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Announcements</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-3 rounded-lg border border-border bg-secondary/30">
                    <p className="font-medium text-sm">{ann.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{ann.message}</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">{formatDateTime(ann.created_at)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Preparation Tasks */}
          {registration && (
            <Card className="bg-card/50 border-border">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ListTodo className="w-5 h-5 text-primary" /> Preparation Tasks</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input placeholder="Add a task (e.g., Prepare presentation slides)" value={newTask} onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()} />
                  <Button onClick={addTask} size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one to track your preparation.</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                        <button onClick={() => toggleTask(task.id, task.completed)} className="shrink-0">
                          {task.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />}
                        </button>
                        <span className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Registration Status */}
          <Card className="bg-card/50 border-border sticky top-20">
            <CardContent className="p-5">
              {registration ? (
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </div>
                  <p className="font-semibold mb-1">You're Registered!</p>
                  <p className="text-xs text-muted-foreground mb-4">Registration ID: {registration.registration_id}</p>
                  <Button onClick={() => setShowQR(true)} className="w-full bg-gradient-brand hover:opacity-90 mb-2">
                    <QrCode className="w-4 h-4 mr-2" /> View QR Pass
                  </Button>
                  {hasAttended && (
                    <Badge className="bg-success/20 text-success w-full justify-center py-1.5">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Attended
                    </Badge>
                  )}
                  {!isPast && !hasAttended && (
                    <Button variant="ghost" onClick={handleCancel} className="w-full text-destructive hover:text-destructive text-sm mt-2">
                      Cancel Registration
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {regOpen ? (
                    <>
                      <Button onClick={handleRegister} disabled={registering} className="w-full bg-gradient-brand hover:opacity-90 mb-3">
                        {registering ? 'Registering...' : 'Register Now'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Registration closes in {getDaysUntil(event.registration_deadline)} days
                      </p>
                    </>
                  ) : isPast ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">This event has ended.</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Registration closed.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="bg-card/50 border-border">
            <CardHeader><CardTitle className="text-base">Event Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Starts</p>
                  <p>{formatDateTime(event.start_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Ends</p>
                  <p>{formatDateTime(event.end_date)}</p>
                </div>
              </div>
              {event.reporting_time && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Reporting Time</p>
                    <p>{event.reporting_time}</p>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Venue</p>
                  <p>{event.venue || 'TBA'}</p>
                  {event.building && <p className="text-xs text-muted-foreground">{event.building} · {event.room}</p>}
                </div>
              </div>
              {event.online_link && (
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Online Link</p>
                    <a href={event.online_link} target="_blank" className="text-primary hover:underline text-xs">{event.online_link}</a>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Registrations</p>
                  <p>{regCount} {event.capacity > 0 ? `/ ${event.capacity}` : ''} registered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Points</p>
                  <p>+{event.points_for_registration} for registration · +{event.points_for_attendance} for attendance</p>
                </div>
              </div>
              {!isPast && (
                <div className="pt-2 border-t border-border">
                  <p className="text-center text-primary font-medium text-sm">{getCountdown(event.start_date)} to event start</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Pass Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Your Event Pass</DialogTitle>
            <DialogDescription className="text-center">Show this QR code at the venue for check-in</DialogDescription>
          </DialogHeader>
          {registration && event && (
            <div className="text-center space-y-4">
              <div className="bg-white p-6 rounded-xl mx-auto w-fit">
                <QRCodeSVG value={registration.qr_data} size={200} />
              </div>
              <div>
                <p className="font-bold text-lg">{event.title}</p>
                <p className="text-sm text-muted-foreground">{formatDate(event.start_date)} · {event.venue}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-left text-sm">
                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Name</span><span>{profile?.full_name}</span></div>
                <div className="flex justify-between mb-1"><span className="text-muted-foreground">Reg ID</span><span className="font-mono text-xs">{registration.registration_id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className="bg-success/20 text-success">Registered</Badge></div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" /> Print / Save Pass
              </Button>
              <p className="text-xs text-muted-foreground">Note: QR code alone does not prove attendance. Check-in by an organizer is required.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
