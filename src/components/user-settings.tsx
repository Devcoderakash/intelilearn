'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useHistory } from '@/hooks/use-history';
import { Skeleton } from "@/components/ui/skeleton";

export function UserSettings() {
  const { user, isLoading } = useHistory();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // REDIRECT IF NOT AUTHENTICATED
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/auth';
    }
  }, [user, isLoading]);

  if (isLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-pulse pt-10">
        <div className="flex justify-between items-center">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 bg-zinc-900 rounded-xl" />
            <Skeleton className="h-6 w-96 bg-zinc-900 rounded-xl" />
          </div>
          <Skeleton className="h-12 w-32 bg-zinc-900 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] bg-zinc-900 rounded-[2.5rem]" />
          <Skeleton className="h-[400px] bg-zinc-900 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    // Client-side validation matching Supabase settings
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must contain both letters and digits');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword,
        current_password: currentPassword 
      });
      if (error) throw error;
      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        email: newEmail,
        current_password: currentPassword 
      });
      if (error) throw error;
      setSuccess('Email update initiated. Please confirm the change via the links sent to your old and new email addresses.');
      setNewEmail('');
      setCurrentPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Account Security</h2>
          <p className="text-zinc-500 font-medium">Manage your credentials and security preferences.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="border-zinc-800 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-4 h-4 mr-3" /> Log Out
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 rounded-2xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Security Error</AlertTitle>
          <AlertDescription className="text-xs font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-emerald-500/10 border-emerald-500/50 text-emerald-500 rounded-2xl">
          <CheckCircle2 className="h-5 w-5" />
          <AlertTitle className="font-black uppercase tracking-widest text-[10px]">Success</AlertTitle>
          <AlertDescription className="text-xs font-semibold">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Update Password */}
        <Card className="bg-[#0c0c0c] border-2 border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl relative group transition-all hover:border-primary/20">
          <CardHeader className="p-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
              <Lock className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Update Password</CardTitle>
            <CardDescription className="text-zinc-600 font-medium">Securely change your access credentials.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">Current Password</Label>
                <div className="relative">
                  <Input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">New Password</Label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-primary/20"
                  placeholder="Min. 6 chars, A-Z, 0-9"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">Confirm Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-primary/20"
                  placeholder="Repeat new password"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-black uppercase tracking-tight bg-primary text-black hover:bg-primary/90">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update Email */}
        <Card className="bg-[#0c0c0c] border-2 border-zinc-800/50 rounded-[2.5rem] overflow-hidden shadow-2xl relative group transition-all hover:border-emerald-500/20">
          <CardHeader className="p-8">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 transition-transform group-hover:scale-110">
              <Mail className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-black text-white uppercase tracking-tight">Change Email</CardTitle>
            <CardDescription className="text-zinc-600 font-medium">Update your primary contact address.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <form onSubmit={handleUpdateEmail} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">Current Password</Label>
                <Input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-primary/20 shadow-inner"
                  placeholder="Verify your identity"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 px-1">New Email Address</Label>
                <Input 
                  type="email" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 h-12 rounded-xl focus:ring-primary/20"
                  placeholder="new@example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-black uppercase tracking-tight bg-white text-black hover:bg-zinc-200">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Change Email'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="p-8 pt-0">
            <div className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed text-zinc-500 font-medium">
                <span className="font-black uppercase text-zinc-300">Security Notice:</span> Changing your email will send confirmation links to BOTH your current and new addresses.
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
