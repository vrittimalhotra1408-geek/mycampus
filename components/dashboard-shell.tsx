'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import {
  LayoutDashboard, Compass, Route, Calendar, Brain, Award, Trophy,
  Bot, User, Settings, LogOut, Sparkles, Bell, Menu, X, Shield,
  Users, BarChart3, Menu as MenuIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const studentNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/discover', label: 'Discover Events', icon: Compass },
  { href: '/dashboard/journey', label: 'My Journey', icon: Route },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/recommendations', label: 'AI Recommendations', icon: Brain },
  { href: '/dashboard/certificates', label: 'Certificates & Achievements', icon: Award },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/copilot', label: 'AI Campus Assistant', icon: Bot },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const organizerNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/organizer/events', label: 'Manage Events', icon: Compass },
  { href: '/dashboard/organizer/attendance', label: 'QR Attendance', icon: Shield },
  { href: '/dashboard/organizer/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/discover', label: 'Discover Events', icon: Users },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/admin', label: 'Campus Analytics', icon: BarChart3 },
  { href: '/dashboard/discover', label: 'All Events', icon: Compass },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const nav = profile?.role === 'admin' ? adminNav : profile?.role === 'organizer' ? organizerNav : studentNav;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const loadNotifications = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data);
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    setNotifications([]);
    toast.success('Notifications marked as read');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className={cn(
        'fixed lg:sticky top-0 z-40 h-screen w-64 border-r border-border bg-card/50 backdrop-blur transition-transform',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">MyCampus</span>
            </Link>
          </div>

          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-brand-subtle flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
                <Badge variant="secondary" className="text-xs capitalize bg-primary/20 text-primary">
                  {profile?.role || 'student'}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    active
                      ? 'bg-gradient-brand-subtle text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 glass border-b border-border h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <button
                onClick={loadNotifications}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-popover shadow-xl hidden group-hover:block z-50">
                  <div className="p-3 border-b border-border flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto scrollbar-thin">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 border-b border-border hover:bg-secondary/30">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link href="/dashboard/profile">
              <div className="w-8 h-8 rounded-full bg-gradient-brand-subtle flex items-center justify-center cursor-pointer hover:opacity-80">
                <span className="text-xs font-bold text-primary">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
