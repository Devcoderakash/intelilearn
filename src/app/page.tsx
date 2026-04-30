
'use client';

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Youtube, 
  UserRound, 
  FileQuestion, 
  TrendingUp, 
  Calendar, 
  Briefcase,
  History,
  Menu,
  Star,
  User,
  Lock,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useHistory } from "@/hooks/use-history";
import { supabase } from "@/lib/supabase";
import { Dashboard } from "@/components/dashboard";
import { AiTutor } from "@/components/ai-tutor";
import { VideoAnalyzer } from "@/components/video-analyzer";
import { MockInterview } from "@/components/mock-interview";
import { PYQEngine } from "@/components/pyq-engine";
import { StudentPerformance } from "@/components/student-performance";
import { TimetableScheduler } from "@/components/timetable-scheduler";
import { InternshipEngine } from "@/components/internship-engine";
import { HistoryPanel } from "@/components/history/history-panel";
import { UserSettings } from "@/components/user-settings";
import { FadeTransition } from '@/components/premium-ui';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { id: 'video', label: 'VIDEO HELPER', icon: Youtube },
  { id: 'tutor', label: 'AI TUTOR', icon: MessageSquare },
  { id: 'interview', label: 'INTERVIEW', icon: UserRound },
  { id: 'pyq', label: 'TEST MAKER', icon: FileQuestion },
  { id: 'performance', label: 'PROGRESS', icon: TrendingUp },
  { id: 'scheduler', label: 'PLANNER', icon: Calendar },
  { id: 'internship', label: 'CAREER', icon: Briefcase },
  { id: 'history', label: 'HISTORY', icon: History }
];

export default function App() {
  const [view, setView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [restoredSession, setRestoredSession] = useState<any>(null);
  const { user, isLoading: isUserLoading } = useHistory();
  const [stats, setStats] = useState<any>({
    chats: 0, videos: 0, interviews: 0, questions: 0,
    tutor_count: 0, video_count: 0, interview_count: 0, pyq_count: 0,
    performance_count: 0, scheduler_count: 0, internship_count: 0
  });

  useEffect(() => {
    async function fetchStats() {
      if (user) {
        try {
          const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', user.id);
          if (data && data.length > 0) {
            setStats(data[0]);
          } else {
            // Initialize stats if not present
            const initialStats = { 
              user_id: user.id,
              chats: 0, videos: 0, interviews: 0, questions: 0,
              tutor_count: 0, video_count: 0, interview_count: 0, pyq_count: 0,
              performance_count: 0, scheduler_count: 0, internship_count: 0
            };
            await supabase.from('user_stats').insert([initialStats]);
            setStats(initialStats);
          }
        } catch (e) {
          console.warn("Stats fetch failed, using local defaults.");
        }
      }
    }
    fetchStats();
  }, [user]);

  const incrementStat = async (key: string) => {
    if (user) {
      const newCount = (stats[key] || 0) + 1;
      setStats((prev: any) => ({ ...prev, [key]: newCount }));
      try {
        await supabase.from('user_stats').update({ [key]: newCount }).eq('user_id', user.id);
      } catch (e) {
        console.error("Failed to sync stat to database");
      }
    }
  };

  const handleNavClick = (id: string, clearSession = true) => {
    setView(id);
    setIsMobileMenuOpen(false);
    if (clearSession) setRestoredSession(null);
  };

  const handleResume = (item: any) => {
    setRestoredSession(item);
    // Map module_type to our view IDs
    const viewMap: Record<string, string> = {
      'video': 'video',
      'tutor': 'tutor',
      'test': 'pyq',
      'internship': 'internship',
      'performance': 'performance',
      'timetable': 'scheduler'
    };
    setView(viewMap[item.module_type] || 'dashboard');
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col overflow-hidden">
        <header className="h-20 border-b border-zinc-900 flex items-center px-12 animate-pulse justify-between">
          <Skeleton className="h-8 w-32 bg-zinc-900" />
          <div className="flex gap-4">
             {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-20 bg-zinc-900" />)}
          </div>
          <Skeleton className="h-10 w-10 rounded-full bg-zinc-900" />
        </header>
        <main className="flex-1 p-12 space-y-12 animate-pulse">
           <Skeleton className="w-full h-80 rounded-[3rem] bg-zinc-900" />
           <div className="grid grid-cols-4 gap-6">
             {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-[2rem] bg-zinc-900" />)}
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 flex flex-col font-sans selection:bg-primary selection:text-black">
      {/* PROFESSIONAL HORIZONTAL NAVBAR */}
      <header className="sticky top-0 z-[100] h-20 bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-zinc-900/50 px-6 md:px-12 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="hidden lg:flex text-zinc-500 hover:text-primary transition-colors h-10 w-10 rounded-xl"
            title={isSidebarVisible ? "Hide Navigation" : "Show Navigation"}
          >
            {isSidebarVisible ? <PanelLeftClose className="w-6 h-6" /> : <PanelLeft className="w-6 h-6" />}
          </Button>

          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setView('dashboard')}>
            <Image 
              src="/favicon.ico" 
              width={32} 
              height={32} 
              alt="IntelliLearn" 
              className="rounded-lg shadow-2xl transition-transform group-hover:scale-105"
            ></Image>
            <span className="font-black text-xl md:text-2xl tracking-tighter text-white tracking-widest hidden xs:block">IntelliLearn</span>
          </div>
        </div>

        {/* Desktop Nav Items */}
        {isSidebarVisible && (
          <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800/50 shadow-inner overflow-x-auto no-scrollbar max-w-[50%] animate-in fade-in slide-in-from-top-1 duration-300">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all uppercase whitespace-nowrap",
                  view === item.id 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                )}
                aria-current={view === item.id ? 'page' : undefined}
              >
                <item.icon className={cn("w-3.5 h-3.5", view === item.id ? 'text-black' : 'text-zinc-600')} />
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-4 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-widest shadow-inner">
              <Star className="w-3 h-3 text-primary fill-current" />
              {(stats?.chats || 0) + (stats?.videos || 0) + (stats?.interviews || 0)} ACTIONS PERFORMED
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-zinc-800 hover:ring-primary/50 transition-all shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-orange-500/20" />
                <User className="w-5 h-5 text-white relative z-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-900 shadow-2xl rounded-2xl p-2" align="end">
              <DropdownMenuLabel className="px-3 py-4">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">{user?.email}</p>
                <p className="text-[8px] text-zinc-500 font-bold truncate mt-1">{user?.uid}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-900" />
              <DropdownMenuItem onClick={() => setView('performance')} className="rounded-xl py-3 focus:bg-primary focus:text-black group cursor-pointer">
                <TrendingUp className="w-4 h-4 mr-2 text-zinc-500 group-focus:text-black" />
                <span className="text-[10px] font-black uppercase tracking-widest">My Progress</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('internship')} className="rounded-xl py-3 focus:bg-primary focus:text-black group cursor-pointer">
                <Briefcase className="w-4 h-4 mr-2 text-zinc-500 group-focus:text-black" />
                <span className="text-[10px] font-black uppercase tracking-widest">Career Hub</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-900" />
              <DropdownMenuItem onClick={() => setView('settings')} className="rounded-xl py-3 focus:bg-primary focus:text-black group cursor-pointer">
                <Lock className="w-4 h-4 mr-2 text-zinc-500 group-focus:text-black" />
                <span className="text-[10px] font-black uppercase tracking-widest">Account & Safety</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400 hover:bg-zinc-900 rounded-xl h-10 w-10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="top" className="bg-[#0a0a0a] border-b-zinc-900 p-8 h-auto">
              <SheetTitle className="text-white font-black uppercase tracking-tighter mb-8 text-xl">Navigation Menu</SheetTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border transition-all",
                      view === item.id 
                        ? 'bg-primary border-primary text-black shadow-2xl shadow-primary/20' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[9px] font-black tracking-widest uppercase">{item.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative" role="main">
        <FadeTransition viewKey={view} className="h-full">
          {view === 'dashboard' && <div className="h-full overflow-y-auto p-6 md:p-12"><Dashboard stats={stats || {}} setView={setView} user={user} /></div>}
          {view === 'tutor' && <AiTutor onAction={() => incrementStat('chats')} initialState={restoredSession} />}
          {view === 'video' && <VideoAnalyzer onAction={() => incrementStat('videos')} initialState={restoredSession} />}
          {view === 'interview' && <div className="h-full overflow-y-auto p-6 md:p-12"><MockInterview onAction={() => incrementStat('interviews')} initialState={restoredSession} /></div>}
          {view === 'pyq' && <div className="h-full overflow-y-auto p-6 md:p-12"><PYQEngine onAction={() => incrementStat('questions')} initialState={restoredSession} /></div>}
          {view === 'performance' && <div className="h-full overflow-y-auto p-6 md:p-12"><StudentPerformance onAction={() => incrementStat('performance_count')} initialState={restoredSession} /></div>}
          {view === 'scheduler' && <div className="h-full overflow-y-auto p-6 md:p-12"><TimetableScheduler onAction={() => incrementStat('scheduler_count')} initialState={restoredSession} /></div>}
          {view === 'internship' && <InternshipEngine onAction={() => incrementStat('internship_count')} initialState={restoredSession} />}
          {view === 'history' && <div className="h-full overflow-y-auto p-6 md:p-12"><HistoryPanel onResume={handleResume} /></div>}
          {view === 'settings' && <div className="h-full overflow-y-auto p-6 md:p-12 bg-[#050505]"><UserSettings /></div>}
        </FadeTransition>
      </main>

      {/* Institutional Status Bar */}
      <footer className="h-8 bg-black border-t border-zinc-900/50 px-6 md:px-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Global Intelligence System Active</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">v5.4 Core Resilience</span>
          <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest">Encrypted: AES-256</span>
        </div>
      </footer>
    </div>
  );
}
