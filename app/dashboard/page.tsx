'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase, EventItem, Registration, NotificationItem, PointsTransaction } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle2, Award, TrendingUp, Clock, QrCode, ArrowRight, Bell, Trophy, Zap, AlertTriangle, MapPin } from 'lucide-react';
import { formatDateTime, getCountdown, getCategoryLabel, getDaysUntil, formatINR } from '@/lib/types';
import { format } from 'date-fns';

export default function DashboardOverview() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [points, setPoints] = useState<PointsTransaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({ total: 0, attended: 0, certificates: 0, points: 0 });

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);

    const { data: regs } = await supabase
      .from('registrations')
      .select('*, event:events(*)')
      .eq('student_id', profile.id)
      .eq('status', 'registered')
      .order('registered_at', { ascending: false });
    setRegistrations(regs as unknown as Registration[] || []);

    const { data: pts } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('student_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setPoints(pts as PointsTransaction[] || []);

    const { data: notifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setNotifications(notifs as NotificationItem[] || []);

    const { count: totalReg } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id)
      .neq('status', 'cancelled');

    const { count: attendedCount } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id);

    const { count: certCount } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id);

    const totalPoints = (pts as PointsTransaction[] || []).reduce((sum, p) => sum + p.points, 0);

    setStats({
      total: totalReg || 0,
      attended: attendedCount || 0,
      certificates: certCount || 0,
      points: totalPoints,
    });
    setLoading(false);
  };

  const now = new Date();
  const upcomingEvents = registrations
    .filter((r) => r.event && new Date(r.event.start_date) > now)
    .sort((a, b) => new Date(a.event!.start_date).getTime() - new Date(b.event!.start_date).getTime())
    .slice(0, 4);

  const todayEvents = registrations.filter((r) => {
    if (!r.event) return false;
    const start = new Date(r.event.start_date);
    const end = new Date(r.event.end_date);
    return start <= now && end >= now;
  });

  const thisWeekEvents = registrations.filter((r) => {
    if (!r.event) return false;
    const start = new Date(r.event.start_date);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return start > now && start <= weekFromNow;
  });

  const upcomingDeadlines = registrations
    .filter((r) => r.event && new Date(r.event.registration_deadline) > now)
    .sort((a, b) => new Date(a.event!.registration_deadline).getTime() - new Date(b.event!.registration_deadline).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="h-24 rounded-xl bg-card/50 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-card/50 animate-pulse" />)}
          </div>
          <div className="h-64 rounded-xl bg-card/50 animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening in your campus event journey today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Registrations', value: stats.total, icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Attended', value: stats.attended, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Certificates', value: stats.certificates, icon: Award, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Points', value: stats.points, icon: Zap, color: 'text-accent', bg: 'bg-accent/10' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card/50 border-border hover:border-primary/20 transition-colors">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
              <Link href="/dashboard/journey">
                <Button variant="ghost" size="sm" className="text-primary">View All <ArrowRight className="ml-1 w-3 h-3" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No upcoming events registered yet.</p>
                  <Link href="/dashboard/discover">
                    <Button size="sm" className="bg-gradient-brand hover:opacity-90">Discover Events</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((reg) => (
                    <Link key={reg.id} href={`/dashboard/events/${reg.event_id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/30 transition-all group">
                        <div className="w-14 h-14 rounded-lg bg-gradient-brand-subtle flex flex-col items-center justify-center shrink-0">
                          <span className="text-[10px] text-primary font-semibold">
                            {format(new Date(reg.event!.start_date), 'MMM').toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(reg.event!.start_date), 'dd')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">{reg.event!.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDateTime(reg.event!.start_date)}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {reg.event!.venue || 'TBA'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="secondary" className="text-xs">{getCategoryLabel(reg.event!.category)}</Badge>
                          <p className="text-xs text-primary font-medium mt-1">{getCountdown(reg.event!.start_date)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today & This Week */}
          {(todayEvents.length > 0 || thisWeekEvents.length > 0) && (
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Happening Now & This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayEvents.map((reg) => (
                    <div key={reg.id} className="flex items-center gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
                      <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{reg.event!.title}</p>
                        <p className="text-xs text-muted-foreground">Today · {formatDateTime(reg.event!.start_date)}</p>
                      </div>
                      <Badge className="bg-warning/20 text-warning">Live</Badge>
                    </div>
                  ))}
                  {thisWeekEvents.map((reg) => (
                    <Link key={reg.id} href={`/dashboard/events/${reg.event_id}`}>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-all">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{reg.event!.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(reg.event!.start_date)}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Deadlines */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming deadlines.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingDeadlines.map((reg) => {
                    const days = getDaysUntil(reg.event!.registration_deadline);
                    return (
                      <div key={reg.id} className="p-3 rounded-lg border border-border">
                        <p className="text-sm font-medium truncate">{reg.event!.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{formatDateTime(reg.event!.registration_deadline)}</span>
                          <Badge variant={days <= 2 ? 'destructive' : 'secondary'} className="text-xs">
                            {days} days left
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-primary" /> Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent notifications.</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 rounded-lg border border-border">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      <p className="text-xs text-muted-foreground/50 mt-1">{format(new Date(n.created_at), 'dd MMM, HH:mm')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points History */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> Points History</CardTitle>
            </CardHeader>
            <CardContent>
              {points.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No points earned yet.</p>
              ) : (
                <div className="space-y-2">
                  {points.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate">{p.reason}</span>
                      <Badge variant="secondary" className={p.points > 0 ? 'text-success' : 'text-destructive'}>
                        {p.points > 0 ? '+' : ''}{p.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
