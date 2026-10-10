'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Calendar, MapPin, QrCode, Trophy, Brain, Bell, Users, ArrowRight,
  Sparkles, Zap, Shield, TrendingUp, Clock, Award, ChevronRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<'student' | 'organizer' | 'admin'>('student');

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">MyCampus</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-foreground transition-colors">For You</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')} className="text-muted-foreground hover:text-foreground">
              Log In
            </Button>
            <Button size="sm" onClick={() => router.push('/signup')} className="bg-gradient-brand hover:opacity-90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              <span className="bg-gradient-brand bg-clip-text text-transparent font-semibold">One Campus. Every Event. Your Journey.</span>
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Your Campus Life.<br />
              <span className="text-gradient">One Intelligent Journey.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
              Every event, every deadline, every achievement — connected in one place.
              Discover, register, attend, and track your entire campus event journey with AI-powered recommendations.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={() => router.push('/signup')} className="bg-gradient-brand hover:opacity-90 glow-primary">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/discover')}>
                Explore Events
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> No more scattered alerts</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> QR check-ins</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" /> Verified certificates</div>
            </div>
          </div>

          {/* Dashboard Preview Mockup */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur p-6 shadow-2xl glow-primary">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Welcome back,</p>
                  <p className="text-lg font-semibold">Aarav Sharma</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">Student</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Registrations', value: '12', icon: Calendar, color: 'text-primary' },
                  { label: 'Attended', value: '8', icon: CheckCircle2, color: 'text-success' },
                  { label: 'Certificates', value: '5', icon: Award, color: 'text-warning' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border bg-secondary/50 p-3">
                    <stat.icon className={`w-4 h-4 mb-1 ${stat.color}`} />
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">UPCOMING EVENTS</p>
                {[
                  { name: 'AI/ML Hackathon 2026', date: '15 Oct', time: '9:00 AM', venue: 'Main Auditorium' },
                  { name: 'Data Science Workshop', date: '18 Oct', time: '2:00 PM', venue: 'Lab 204' },
                ].map((ev) => (
                  <div key={ev.name} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3 hover:border-primary/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-brand-subtle flex flex-col items-center justify-center">
                      <span className="text-[10px] text-primary font-semibold">{ev.date.split(' ')[1]}</span>
                      <span className="text-xs font-bold text-primary">{ev.date.split(' ')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">{ev.time} · {ev.venue}</p>
                    </div>
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-4 -right-4 rounded-xl border border-border bg-card p-3 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs font-medium">AI Match</p>
                  <p className="text-[10px] text-muted-foreground">94% relevant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">The Problem</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Campus events are everywhere.<br />Your journey is nowhere.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Bell, title: 'Scattered Announcements', desc: 'WhatsApp groups, Instagram, email, college websites — events announced across a dozen channels you barely check.' },
              { icon: Clock, title: 'Missed Deadlines', desc: 'Registration deadlines slip by because nobody consolidated them. You find out the hackathon closed yesterday.' },
              { icon: Users, title: 'Manual Registration', desc: 'Google Forms, offline sign-ups, DM-the-PR — each event has a different registration process.' },
              { icon: Shield, title: 'Disconnected Records', desc: 'No proof you attended. Certificates lost in email. Your participation history lives in nobody\'s system.' },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3 bg-primary/20 text-primary">The Solution</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Everything connected.<br />One intelligent platform.</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Unified Event Timeline', desc: 'Every registered event — dates, deadlines, venues, schedules — in one intelligent chronological timeline.' },
              { icon: Brain, title: 'AI Recommendations', desc: 'Smart matching engine suggests events based on your interests, skills, and career goals with relevance scores.' },
              { icon: Bell, title: 'Smart Reminders & Conflict Detection', desc: 'Automatic deadline reminders and scheduling conflict warnings so you never double-book or miss a deadline.' },
              { icon: QrCode, title: 'QR Registration & Attendance', desc: 'Digital QR passes for every registration. Organizers scan to check in — no more manual attendance.' },
              { icon: Award, title: 'Verified Certificates & Achievements', desc: 'Attendance-verified certificates, achievement badges, and a shareable profile of your campus journey.' },
              { icon: TrendingUp, title: 'Organizer Analytics', desc: 'Registration counts, attendance rates, engagement metrics, and feedback analytics for every event.' },
              { icon: Sparkles, title: 'Campus Copilot', desc: 'AI assistant that answers questions about your events, deadlines, and schedule in natural language.' },
              { icon: Trophy, title: 'Gamification & Leaderboard', desc: 'Earn points for registrations and attendance. Climb the campus leaderboard and unlock achievement badges.' },
              { icon: MapPin, title: 'India-Ready', desc: 'IST scheduling, INR formatting, Indian college structures, and mobile-friendly for budget smartphones.' },
            ].map((item) => (
              <Card key={item.title} className="bg-card/50 border-border hover:border-primary/30 transition-all hover:translate-y-[-2px] group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-brand-subtle flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Discover → Register → Attend → Achieve</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-px bg-gradient-to-r from-primary via-accent to-primary opacity-30" />
            {[
              { step: '01', icon: Sparkles, title: 'Discover', desc: 'AI recommends events matching your interests, skills, and career goals.' },
              { step: '02', icon: QrCode, title: 'Register', desc: 'One-click registration with instant QR pass generation and journey tracking.' },
              { step: '03', icon: CheckCircle2, title: 'Attend', desc: 'Organizers scan your QR pass. Attendance is verified and recorded.' },
              { step: '04', icon: Trophy, title: 'Achieve', desc: 'Earn points, badges, and verified certificates. Build your achievement profile.' },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="relative inline-flex w-24 h-24 rounded-full bg-card border-2 border-primary/30 items-center justify-center mb-4 group hover:border-primary transition-colors">
                  <item.icon className="w-8 h-8 text-primary" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-brand text-xs font-bold flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based value proposition */}
      <section id="roles" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Built For Everyone</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Whatever your role, MyCampus works for you.</h2>
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {(['student', 'organizer', 'admin'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                  activeRole === role
                    ? 'bg-gradient-brand text-white'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {role === 'admin' ? 'College Admin' : role}
              </button>
            ))}
          </div>
          <Card className="bg-card/50 border-border max-w-3xl mx-auto">
            <CardContent className="p-8">
              {activeRole === 'student' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Discover events matched to your interests with AI',
                    'Track all your events in one unified timeline',
                    'Get QR passes and deadline reminders',
                    'Never miss a deadline with smart notifications',
                    'Earn points, badges, and verified certificates',
                    'Ask Campus Copilot about your schedule',
                    'See scheduling conflicts before they happen',
                    'Build a shareable achievement profile',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeRole === 'organizer' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Publish and manage events with full details',
                    'Track registrations and participant lists',
                    'Scan QR codes for instant attendance check-in',
                    'Send announcements to registered students',
                    'Issue verified certificates to attendees',
                    'View engagement and feedback analytics',
                    'Export registration and attendance data',
                    'Monitor event performance metrics',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeRole === 'admin' && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Campus-wide event and participation analytics',
                    'Monitor club activity and engagement trends',
                    'Track total students, events, and registrations',
                    'View attendance rates and category breakdowns',
                    'Moderate events and manage organizer approvals',
                    'Participation trend charts and comparisons',
                    'Certificate verification and statistics',
                    'Engagement metrics across the institution',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-12 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Don't miss your next opportunity.</h2>
              <p className="text-lg text-muted-foreground mb-8">Start your MyCampus journey today.</p>
              <Button size="lg" onClick={() => router.push('/signup')} className="bg-gradient-brand hover:opacity-90 glow-primary">
                Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">MyCampus</span>
              </div>
              <p className="text-sm text-muted-foreground">The intelligent infrastructure connecting every campus opportunity to a student's journey.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Team</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Event Discovery</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">AI Recommendations</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">QR Attendance</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Campus Copilot</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>MyCampus is not just an event listing website. It is the intelligent infrastructure connecting every campus opportunity to a student's journey.</p>
            <p className="mt-2">© 2026 MyCampus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
