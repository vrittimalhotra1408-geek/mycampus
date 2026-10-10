'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { DashboardShell } from '@/components/dashboard-shell';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { INTEREST_OPTIONS, SKILL_OPTIONS, CATEGORIES } from '@/lib/types';
import { ArrowRight, GraduationCap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [college, setCollege] = useState(profile?.college || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [yearOfStudy, setYearOfStudy] = useState(profile?.year_of_study || '');
  const [interests, setInterests] = useState<string[]>(profile?.interests || []);
  const [preferredCategories, setPreferredCategories] = useState<string[]>(profile?.preferred_categories || []);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [careerGoals, setCareerGoals] = useState(profile?.career_goals || '');

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const handleComplete = async () => {
    if (!profile) return;
    if (!college || !course) {
      toast.error('Please fill in college and course');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      college, department, course, year_of_study: yearOfStudy,
      interests, preferred_categories: interests,
      skills, career_goals: careerGoals, onboarded: true,
    }).eq('id', profile.id);

    if (error) {
      toast.error('Failed to save profile');
      setLoading(false);
      return;
    }
    await refreshProfile();
    toast.success('Profile complete! Welcome to MyCampus.');
    router.push('/dashboard');
  };

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card/50 border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
            <p className="text-sm text-muted-foreground">Help us personalize your event journey with AI recommendations</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>College *</Label>
                <Input placeholder="IIT Delhi" value={college} onChange={(e) => setCollege(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input placeholder="Computer Science" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Course *</Label>
                <Input placeholder="B.Tech" value={course} onChange={(e) => setCourse(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Year of Study</Label>
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
              <Label>Interests</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button key={interest} type="button" onClick={() => toggle(interests, setInterests, interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      interests.includes(interest) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'
                    }`}>
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Preferred Event Categories</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.value} type="button" onClick={() => toggle(preferredCategories, setPreferredCategories, cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      preferredCategories.includes(cat.value) ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/30'
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                {SKILL_OPTIONS.map((skill) => (
                  <button key={skill} type="button" onClick={() => toggle(skills, setSkills, skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      skills.includes(skill) ? 'border-success bg-success/10 text-success' : 'border-border text-muted-foreground hover:border-success/30'
                    }`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Career Goals</Label>
              <Input placeholder="Software Engineer, AI Researcher, Product Manager..." value={careerGoals} onChange={(e) => setCareerGoals(e.target.value)} />
            </div>

            <Button onClick={handleComplete} disabled={loading} className="w-full bg-gradient-brand hover:opacity-90">
              {loading ? 'Saving...' : 'Complete Setup'} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
