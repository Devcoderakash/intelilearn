
'use client';

import React, { useState } from 'react';
import { 
  History, 
  Lock, 
  Calendar, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Cpu,
  Zap,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  ClipboardCheck
} from 'lucide-react';
import { useHistory, HistoryItem } from '@/hooks/use-history';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AreaChart, 
  Area, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MathText } from '../math-text';

export function HistoryPanel({ onResume }: { onResume: (item: HistoryItem) => void }) {
  const { user, history, isLoading, clearHistory, error, isSaving } = useHistory();
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFullOutput, setShowFullOutput] = useState<string | null>(null);

  const formatInput = (item: HistoryItem) => {
    try {
      if (item.module_type === 'tutor' || item.module_type === 'video') {
        return item.input_data.query || item.input_data.url || "Session context missing";
      }
      if (item.module_type === 'internship') {
        return `Internship search for ${item.input_data.specialization || 'General'}`;
      }
      if (item.module_type === 'performance') {
        return `Academic analysis for ${item.input_data.subject || 'Student Profile'}`;
      }
      if (item.module_type === 'test') {
        return `${item.input_data.subject} Practice Test (${item.input_data.difficulty})`;
      }
      if (item.module_type === 'timetable') {
        return `Study Plan: ${item.input_data.goal}`;
      }
      return JSON.stringify(item.input_data).slice(0, 100);
    } catch {
      return "Data Error";
    }
  };

  const formatSummary = (item: HistoryItem) => {
    if (item.module_type === 'tutor') return item.ai_output.response;
    if (item.module_type === 'performance') return item.ai_output.summary;
    if (item.module_type === 'video') return item.ai_output.summary || item.ai_output.analysis;
    if (item.module_type === 'internship') return `${item.ai_output.count || 0} matching opportunities found.`;
    if (item.module_type === 'test') return `Full practice test generated with ${item.ai_output.count} questions.`;
    if (item.module_type === 'timetable') return item.ai_output.advice;
    return "Analysis complete.";
  };

  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center space-y-8 bg-zinc-950/20 rounded-[3rem] border-2 border-dashed border-zinc-900 overflow-hidden relative transition-all duration-500 hover:bg-zinc-950/40">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] pointer-events-none" />
        
        <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative z-10 animate-pulse">
          <Lock className="w-16 h-16 text-primary" />
        </div>
        
        <div className="space-y-4 relative z-10 max-w-sm">
          <h3 className="text-4xl font-black uppercase tracking-tighter leading-none">History Locked</h3>
          <p className="text-zinc-500 font-medium text-sm leading-relaxed">
            Login to authorize neural storage and track your academic readiness trajectory across all modules.
          </p>
        </div>

        <Button 
          onClick={() => router.push('/auth')}
          className="h-16 px-12 bg-primary text-black font-black uppercase tracking-tight rounded-2xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 group relative z-10 hover:scale-105 active:scale-95"
        >
          Authenticate Me <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse p-4">
        <div className="h-64 bg-zinc-900 rounded-[3rem]" />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const chartData = history?.map(item => ({
    date: new Date(item.created_at).toLocaleDateString(),
    score: item.readiness_score,
  })).reverse() || [];

  return (
    <div className="space-y-12 pb-24 h-full flex flex-col transition-all duration-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-900 px-4">
        <div className="flex items-center gap-4 text-primary">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter">Activity Stream</h3>
            <p className="text-zinc-600 font-bold text-[10px] uppercase tracking-[0.3em]">Authorized Neural History</p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {history && history.length > 0 && (
            <Button 
              variant="ghost" 
              onClick={() => { if(confirm('Permanently clear all neural logs?')) clearHistory(); }}
              disabled={isSaving}
              className="text-[8px] md:text-[10px] uppercase font-black tracking-widest text-zinc-700 hover:text-red-500 hover:bg-red-500/5 px-2 md:px-4 h-8 md:h-10 rounded-lg md:rounded-xl transition-all"
            >
              Clear
            </Button>
          )}
          <Badge variant="outline" className="border-primary/20 text-primary py-0.5 md:py-1 px-2 md:px-4 rounded-full uppercase font-black text-[8px] md:text-[10px] tracking-widest">{history?.length || 0} Sessions</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-12 px-2">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 mx-4">
              <Activity className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
          {history && history.length > 0 ? (
            <>
              {/* Analytics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Readiness Graph */}
                <div className="bg-[#080808] border border-zinc-900 p-8 rounded-[3rem] space-y-6 shadow-sm overflow-hidden relative">
                   <div className="flex items-center gap-3 mb-2">
                     <TrendingUp className="w-4 h-4 text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Performance Over Time</span>
                   </div>
                   <div className="h-48 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                         <defs>
                           <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#FBFF00" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#FBFF00" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px' }}
                            itemStyle={{ color: '#FBFF00', fontWeight: 'bold' }}
                         />
                         <Area type="monotone" dataKey="score" stroke="#FBFF00" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                {/* Module Distribution */}
                <div className="bg-[#080808] border border-zinc-900 p-8 rounded-[3rem] space-y-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-2">
                     <Cpu className="w-4 h-4 text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Resource Utilization</span>
                   </div>
                   <div className="space-y-4">
                     {['internship', 'performance', 'video', 'timetable', 'tutor', 'test'].map(type => {
                       const count = history.filter(h => h.module_type === type).length;
                       const percent = Math.min((count / (history.length || 1)) * 100, 100);
                       return (
                         <div key={type} className="space-y-1" title={`${count} session(s)`}>
                           <div className="flex justify-between text-[10px] uppercase font-black tracking-widest px-1">
                             <span className="text-zinc-500">{type}</span>
                             <span className="text-primary">{count}</span>
                           </div>
                           <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-primary transition-all duration-1000" 
                               style={{ width: `${percent}%` }}
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>

              {/* History Cards */}
              <div className="space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-zinc-950 border border-zinc-900/50 rounded-3xl overflow-hidden group hover:border-primary/20 transition-all duration-300 shadow-inner"
                  >
                    <div 
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="p-6 cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 group-hover:text-primary group-hover:bg-primary/5 transition-all`}>
                          {item.module_type === 'video' ? <VideoIcon /> : 
                           item.module_type === 'internship' ? <BriefcaseIcon /> :
                           item.module_type === 'performance' ? <Activity className="w-5 h-5" /> :
                           item.module_type === 'tutor' ? <MessageSquare className="w-5 h-5" /> :
                           item.module_type === 'test' ? <ClipboardCheck className="w-5 h-5" /> :
                           <Zap className="w-5 h-5" />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black uppercase tracking-tighter text-lg leading-none group-hover:text-white transition-colors">
                            {item.module_type === 'tutor' ? 'AI Tutor' : 
                             item.module_type === 'test' ? 'Practice Test' :
                             item.module_type.charAt(0).toUpperCase() + item.module_type.slice(1)} Session
                          </h4>
                          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 md:gap-8">
                           <div className="text-right">
                             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Score</p>
                             <p className="text-lg md:text-xl font-black text-primary leading-none tracking-tighter">{item.readiness_score}%</p>
                           </div>
                           <div className="p-2 rounded-lg bg-zinc-900/50 text-zinc-700 group-hover:text-primary transition-colors">
                             {expandedId === item.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                           </div>
                      </div>
                    </div>

                    <div 
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === item.id ? 'max-h-[2000px] border-t border-zinc-900 opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="p-8 space-y-8 bg-black/40">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-4">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 border-l-2 border-primary pl-3">Input Context</span>
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/20 text-sm text-zinc-300 font-bold leading-relaxed uppercase tracking-tight">
                              {formatInput(item)}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 border-l-2 border-primary pl-3">Neural Summary</span>
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/20 text-xs text-zinc-500 font-medium leading-relaxed italic line-clamp-4">
                              {formatSummary(item)}
                            </div>
                          </div>
                        </div>
                        
                        {showFullOutput === item.id ? (
                          <div className="p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="prose prose-invert max-w-none">
                              <MathText>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {typeof item.ai_output === 'string' ? item.ai_output : 
                                   item.ai_output.response || 
                                   item.ai_output.summary || 
                                   item.ai_output.analysis || 
                                   JSON.stringify(item.ai_output, null, 2)}
                                </ReactMarkdown>
                              </MathText>
                            </div>
                            <Button 
                              onClick={() => setShowFullOutput(null)}
                              variant="ghost" 
                              className="mt-6 text-[10px] uppercase font-black tracking-widest text-primary"
                            >
                              Minimize Protocol
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => onResume(item)}
                            variant="outline" 
                            className="w-full h-12 border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-primary/50 transition-all"
                          >
                            Resume Full Analysis <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 md:py-24 text-center space-y-4 bg-zinc-900/10 rounded-[3rem] border-2 border-dashed border-zinc-900 px-4">
               <History className="w-10 h-10 md:w-12 md:h-12 text-zinc-800 mx-auto" />
               <p className="text-zinc-700 font-black uppercase tracking-[0.4em] text-xs md:text-sm">Empty Neural Stream</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Minimal Icons for build safety
function VideoIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>; }
function BriefcaseIcon() { return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
