'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap, Building2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { INTEREST_OPTIONS, SKILL_OPTIONS } from '@/lib/types';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'student' | 'organizer' | 'admin'>('student');

  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [careerGoals, setCareerGoals] = useState('');

  const toggleInterest = (val: string) => {
    setInterests((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };
  const toggleSkill = (val: string) => {
    setSkills((prev) => prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        college,
        department,
        course,
        year_of_study: yearOfStudy,
        interests,
        preferred_categories: interests,
        skills,
        career_goals: careerGoals,
        onboarded: role !== 'student' || (college !== '' && course !== ''),
      });
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
      setLoading(false);
      toast.success('Account created! Welcome to MyCampus.');
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <Card className="w-full max-w-2xl relative glass border-border">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </Link>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <p className="text-sm text-muted-foreground">Join MyCampus and start your event journey</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'w-8 bg-gradient-brand' : 'w-4 bg-muted'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Aarav Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'student', label: 'Student', icon: GraduationCap },
                    { value: 'organizer', label: 'Organizer', icon: Building2 },
                    { value: 'admin', label: 'Admin', icon: Shield },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value as typeof role)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                        role === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      <r.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep(2)} disabled={!email || !password || !fullName} className="w-full bg-gradient-brand hover:opacity-90">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSignup} className="space-y-4">
              {role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>College</Label>
                      <Input placeholder="IIT Delhi" value={college} onChange={(e) => setCollege(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input placeholder="Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Input placeholder="B.Tech" value={course} onChange={(e) => setCourse(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)}>
                        <option value="">Select year</option>
                        <option value="1st">1st Year</option>
                        <option value="2nd">2nd Year</option>
                        <option value="3rd">3rd Year</option>
                        <option value="4th">4th Year</option>
                        <option value="5th">5th Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Interests <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_OPTIONS.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            interests.includes(interest) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Skills <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                      {SKILL_OPTIONS.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            skills.includes(skill) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/30'
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Career Goals</Label>
                    <Input placeholder="Software Engineer, AI Researcher..." value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} />
                  </div>
                </>
              )}
              {role === 'organizer' && (
                <>
                  <div className="space-y-2">
                    <Label>College / Institution</Label>
                    <Input placeholder="IIT Delhi" value={college} onChange={(e) => setCollege(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department / Club</Label>
                    <Input placeholder="Computer Science / Coding Club" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                </>
              )}
              {role === 'admin' && (
                <>
                  <div className="space-y-2">
                    <Label>College / Institution</Label>
                    <Input placeholder="IIT Delhi" value={college} onChange={(e) => setCollege(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input placeholder="Administration" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-gradient-brand hover:opacity-90">
                  {loading ? 'Creating account...' : 'Create Account'} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
