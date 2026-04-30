'use client';

import { 
  Youtube, 
  MessageSquare, 
  UserRound, 
  FileQuestion, 
  TrendingUp, 
  Calendar, 
  Briefcase,
  ChevronRight,
  Star,
  History,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

export function Dashboard({ stats, setView, user }: { stats: any, setView: (v: string) => void, user?: any }) {
  const tools = [
    { 
      id: 'video', 
      title: 'Video Helper', 
      description: 'Get key points and summaries from any video.', 
      icon: Youtube, 
      badge: 'Popular',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'group-hover:border-red-500/50',
      accuracy: 98
    },
    { 
      id: 'tutor', 
      title: 'AI Study Tutor', 
      description: 'Ask questions and learn about any topic.', 
      icon: MessageSquare, 
      badge: 'Helpful',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'group-hover:border-blue-500/50',
      accuracy: 97
    },
    { 
      id: 'interview', 
      title: 'Interview Coach', 
      description: 'Practice for your next job interview with AI.', 
      icon: UserRound,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'group-hover:border-emerald-500/50',
      accuracy: 94
    },
    { 
      id: 'pyq', 
      title: 'Practice Tests', 
      description: 'Create tests to practice for your exams.', 
      icon: FileQuestion, 
      badge: 'High Output',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'group-hover:border-purple-500/50',
      accuracy: 99
    },
    { 
      id: 'performance', 
      title: 'My Progress', 
      description: 'See your learning journey and get tips.', 
      icon: TrendingUp, 
      badge: 'Analysis',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'group-hover:border-orange-500/50',
      accuracy: 100
    },
    { 
      id: 'scheduler', 
      title: 'Study Planner', 
      description: 'Create a schedule that fits your busy life.', 
      icon: Calendar,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'group-hover:border-indigo-500/50',
      accuracy: 95
    },
    { 
      id: 'internship', 
      title: 'Career Advice', 
      description: 'Find jobs and internships that match your skills.', 
      icon: Briefcase,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'group-hover:border-amber-500/50',
      accuracy: 93
    },
    { 
      id: 'history', 
      title: 'Activity Stream', 
      description: 'Track your learning progress and AI history.', 
      icon: History,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'group-hover:border-primary/50',
      accuracy: 100
    }
  ];

  const heroImage = PlaceHolderImages.find(img => img.id === 'dashboard-hero');

  return (
    <div className="space-y-12 md:space-y-16">
      <div className="relative overflow-hidden rounded-[3rem] border border-zinc-800 bg-zinc-900/50 shadow-2xl ring-1 ring-white/5">
        {heroImage && (
          <div className="absolute inset-0 z-0">
            <Image 
              src={heroImage.imageUrl} 
              fill 
              className="object-cover opacity-20 mix-blend-luminosity grayscale" 
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
          </div>
        )}
        
        <header className="relative z-10 p-6 md:p-20 space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20 shadow-inner">
            <Star className="w-3.5 h-3.5 fill-current" /> YOUR SMART STUDY SPACE
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tighter text-white leading-[0.9] uppercase">
              Learn Smarter <br/><span className="text-primary">Every Day.</span>
            </h1>
            <p className="text-zinc-500 text-base md:text-2xl max-w-2xl font-medium leading-relaxed tracking-tight">
              Use AI tools to understand videos, practice for interviews, and get better study notes instantly.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 md:pt-6">
            <Button size="lg" onClick={() => setView('tutor')} className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-black uppercase tracking-tight shadow-2xl shadow-primary/30 rounded-2xl group transition-all hover:scale-[1.02] active:scale-95">
              Start Learning <ChevronRight className="ml-2 w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView('interview')} className="h-14 md:h-16 px-8 md:px-12 text-lg md:text-xl font-black uppercase tracking-tight border-2 border-zinc-800 bg-black/40 backdrop-blur-md hover:bg-zinc-900 text-white rounded-2xl transition-all hover:border-zinc-600">
              Try Practice
            </Button>
          </div>
        </header>
      </div>

      {/* Strategic Authentication Nudge - Fully Responsive */}
      {!user && (
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent border-2 border-amber-500/20 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group">
          <div className="relative z-10 space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-amber-500/30">
              <AlertCircle className="w-3 h-3" /> SESSION PERSISTENCE
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight md:leading-none">History Tracking <br className="md:hidden"/><span className="text-amber-500">Not Active</span></h3>
              <p className="text-zinc-500 text-sm md:text-lg font-medium tracking-tight max-w-2xl">Your learning progress and AI analysis will not be saved. <span className="text-white">Authenticate now</span> to sync your activities across sessions.</p>
            </div>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full sm:w-auto h-12 md:h-14 px-6 md:px-10 rounded-xl font-black uppercase tracking-tight bg-amber-500 text-black hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 text-xs md:text-sm"
            >
              Authenticate & Save History
            </Button>
          </div>
          <History className="absolute right-[-2rem] bottom-[-2rem] w-32 h-32 md:w-64 md:h-64 text-amber-500/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}


      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Study Tools</h2>
            <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.2em] mt-2">Tools available to help you: {tools.length}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {tools.map(tool => (
            <Card 
              key={tool.id} 
              className={cn(
                "group transition-all duration-500 cursor-pointer bg-[#0c0c0c] backdrop-blur-3xl border-2 border-zinc-800/50 hover:border-primary/30 hover:-translate-y-2 hover:shadow-2xl rounded-[2.5rem] overflow-hidden relative",
                tool.borderColor
              )}
              onClick={() => setView(tool.id)}
            >
              <div className={cn("absolute -right-10 -top-10 w-40 h-40 blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity duration-700", tool.bgColor)} />
              
              <CardHeader className="p-8 space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className={cn("p-5 rounded-2xl transition-all duration-500 shadow-2xl ring-1 ring-white/5 group-hover:scale-110", tool.bgColor, tool.color)}>
                    <tool.icon className="w-8 h-8" />
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] uppercase font-bold px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 tracking-widest shadow-inner">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <CardTitle className="text-2xl font-black text-white group-hover:text-primary transition-colors uppercase tracking-tight leading-none">{tool.title}</CardTitle>
                  <CardDescription className="text-sm font-medium leading-relaxed text-zinc-500 line-clamp-2">
                    {tool.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="p-8 pt-0 relative z-10">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black border border-zinc-800 text-[10px] text-zinc-600 font-black uppercase tracking-widest group-hover:text-zinc-300 transition-colors shadow-inner">
                  <Star className={cn("w-3.5 h-3.5 fill-current", tool.color)} />
                  AI ACCURACY: {tool.accuracy}%
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, colorClass }: { label: string, value: number, icon: any, colorClass: string }) {
  return (
    <div className="bg-[#0c0c0c] border-2 border-zinc-800/50 p-8 rounded-[2.5rem] flex items-center gap-6 hover:border-primary/20 transition-all duration-500 shadow-xl group">
      <div className={cn("p-5 rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-2xl ring-1 ring-white/5", colorClass)}>
        <Icon className="w-8 h-8" />
      </div>
      <div>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">{label}</p>
      </div>
    </div>
  );
}
