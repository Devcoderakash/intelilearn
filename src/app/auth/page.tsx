
'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  UploadCloud, 
  FileText, 
  Brain, 
  Video, 
  Zap, 
  Mail, 
  Lock, 
  Github,
  Chrome
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation (Matching Supabase settings from screenshot)
    if (!isLogin) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }
      
      const hasLetter = /[a-zA-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      if (!hasLetter || !hasNumber) {
        setError('Password must contain both letters and digits.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Verification email sent! Please check both your inbox and spam folder.');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  if (!mounted) return <div className="min-h-screen bg-[#050505]" />; // Static background while hydrating

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden font-body selection:bg-primary selection:text-black">
      {/* Left Side: Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-24 py-12 relative z-10 bg-zinc-950/20">
        <div className="max-w-md w-full mx-auto space-y-12 transition-all duration-700">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">IntelliLearn</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-[0.9] transition-all duration-500">
              {isLogin ? 'Welcome\nBack' : 'Create Your\nAccount'}
            </h1>
            <p className="text-zinc-500 font-medium text-sm">
              {isLogin ? 'Sign in with your email and password to continue.' : 'Sign up to access your personalized AI learning platform.'}
            </p>
          </div>

          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl gap-2 border border-zinc-800/50">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isLogin ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${!isLogin ? 'bg-primary text-black shadow-xl' : 'text-zinc-500 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="bg-[#0a0a0a] border border-zinc-900 p-8 rounded-[2.5rem] space-y-6 shadow-2xl transition-all duration-500">
              <div className="space-y-2.5">
                <Label className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 block px-1">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700" />
                  <Input 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 h-14 pl-12 rounded-2xl focus:ring-primary/20 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-600 block px-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-700" />
                  <Input 
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-950/50 border-zinc-800 h-14 pl-12 rounded-2xl focus:ring-primary/20 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold uppercase tracking-widest px-1 animate-pulse">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className={`w-full h-14 rounded-2xl font-black uppercase tracking-tight text-lg shadow-2xl transition-all duration-300 ${isLogin ? 'bg-primary text-black hover:bg-primary/90 shadow-primary/20' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                {loading ? 'Processing...' : (isLogin ? 'Login Now' : 'Sign Up')}
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-6 py-4">
             <div className="flex-1 h-px bg-zinc-900" />
             <span className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em]">Secure Access</span>
             <div className="flex-1 h-px bg-zinc-900" />
          </div>

          

          <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-loose">
            <Lock className="w-3 h-3 inline mr-1 mb-0.5" /> We use Supabase authentication for secure access.<br/>
            {isLogin ? 'Login with your credentials to continue learning.' : 'Create your account to get started with IntelliLearn.'}
          </p>
        </div>
      </div>

      {/* Right Side: Platform Visuals */}
      <div className="hidden md:flex flex-1 bg-[#080808] relative overflow-hidden items-center justify-center p-24">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -ml-32 -mb-32" />
        
        <div className="relative z-10 space-y-16 max-w-lg">
          <div className="space-y-6">
            <h2 className="text-7xl font-black tracking-tighter uppercase leading-[0.85]">
              AI-Powered<br/>
              <span className="text-primary italic">Learning</span> Platform
            </h2>
            <p className="text-zinc-500 font-medium text-lg leading-relaxed">
              Your intelligent companion for mastering any subject with interactive tools and personalized guidance.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-6">
            {[
              { icon: Brain, title: "AI Tutor", desc: "Chat with AI for personalized explanations" },
              { icon: Briefcase, title: "Mock Interview", desc: "Practice with real-time AI evaluation" },
              { icon: Video, title: "Video Analyzer", desc: "Extract insights from any video" }
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-6 p-6 bg-zinc-950/50 border border-zinc-900 rounded-[2rem] hover:border-primary/30 transition-all duration-300 group">
                <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                  <f.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black uppercase tracking-tight text-white">{f.title}</h4>
                  <p className="text-xs text-zinc-600 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Stats */}
          <div className="bg-zinc-950/80 border border-zinc-900 p-10 rounded-[2.5rem] shadow-2xl relative">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-8 border-b border-zinc-900 pb-6">Platform Stats</h3>
            <div className="space-y-6">
              {[
                { label: "Users", val: "10K+" },
                { label: "Sessions", val: "50K+" },
                { label: "Accuracy", val: "95%" }
              ].map((s, i) => (
                <div key={i} className="flex justify-between items-center group/stat">
                  <span className="text-zinc-600 font-black text-xs uppercase tracking-widest group-hover/stat:text-white transition-colors">{s.label}</span>
                  <span className="text-primary font-black text-xl tracking-tighter uppercase">{s.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
