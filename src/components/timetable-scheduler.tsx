'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Target, 
  Clock, 
  Brain, 
  Youtube, 
  FileText, 
  Github, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ArrowUp,
  UploadCloud,
  FileUp,
  X as CloseIcon,
  ChevronDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader, FadeTransition, ToastError } from './premium-ui';
import { generateTimetablePlan } from "@/ai/flows/timetable-flow";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MathText } from './math-text';
import { cn } from "@/lib/utils";
import { useHistory } from '@/hooks/use-history';

export function TimetableScheduler({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const { saveHistory } = useHistory();
  const [status, setStatus] = useState<'idle' | 'optimizing' | 'success'>('idle');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [config, setConfig] = useState({ 
    goal: '', 
    subjects: '', 
    dailyHours: 4, 
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    deadline: '',
    constraints: '',
    learningStyle: 'Mixed',
    syllabus: null as File | null
  });

  useEffect(() => {
    if (initialState?.module_type === 'timetable' && initialState.ai_output?.fullData) {
      setConfig(prev => ({ ...prev, ...initialState.input_data }));
      setResult(initialState.ai_output.fullData);
      setStatus('success');
    }
  }, [initialState]);

  const handleGenerate = async () => {
    if (!config.goal || !config.subjects) {
      setError("Please enter your goal and subjects.");
      return;
    }
    
    setStatus('optimizing');
    setError(null);
    
    try {
      const payload = {
        ...config,
        syllabusContent: config.syllabus ? `Syllabus provided: ${config.syllabus.name}. Please generate a plan based on standard curriculum for these subjects if specific content extraction is not available.` : undefined
      };
      // Removing the File object from payload as it's not serializable for the server action
      const { syllabus, ...serializablePayload } = payload;
      
      const plan = await generateTimetablePlan(serializablePayload as any);
      setResult(plan);
      setStatus('success');
      onAction();

      // Save to History
      saveHistory({
        module_type: 'timetable',
        input_data: serializablePayload,
        ai_output: { 
          advice: plan.mentorAdvice,
          goal: serializablePayload.goal,
          fullData: plan
        },
        readiness_score: 100
      });
    } catch (err: any) {
      console.error(err);
      setStatus('idle');
      setError("AI busy. Please try again later.");
    }
  };

  const TimetableSkeleton = () => (
    <div className="space-y-12 animate-pulse pt-10">
      <Skeleton className="h-48 rounded-[2.5rem] bg-zinc-900 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Skeleton className="h-[500px] rounded-[2.5rem] bg-zinc-900" />
        <Skeleton className="h-[500px] rounded-[2.5rem] bg-zinc-900" />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pt-6 space-y-10 pb-20 relative">
      {error && <ToastError message={error} />}
      
      <FadeTransition viewKey={status}>
        {status === 'idle' && (
          <div className="bg-[#0c0c0c] border border-zinc-800/50 p-10 rounded-[2.5rem] shadow-2xl space-y-12">
            <SectionHeader 
              title="Study Planner" 
              subtitle="Create a perfect study schedule that helps you learn and stay on track."
              icon={Calendar}
            />
            
            <div className="space-y-10">
              <div className="flex items-center gap-4 border-b border-zinc-900 pb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-inner">1</div>
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Basic Info</h3>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Target className="w-3 h-3" /> Your Goal
                  </Label>
                  <Input 
                    placeholder="e.g. Pass my math test..."
                    value={config.goal}
                    onChange={(e) => setConfig({...config, goal: e.target.value})}
                    className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-sm md:text-base"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <FileUp className="w-3 h-3 text-primary" /> Upload Syllabus (Optional)
                  </Label>
                  <div 
                    onClick={() => document.getElementById('syllabus-upload')?.click()}
                    className={cn(
                      "group relative border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center transition-all cursor-pointer hover:border-primary/50 bg-[#080808]",
                      config.syllabus && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <input 
                      id="syllabus-upload"
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setConfig({...config, syllabus: file});
                      }}
                    />
                    {config.syllabus ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-primary/20 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-white font-black text-xs uppercase tracking-widest">{config.syllabus.name}</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfig({...config, syllabus: null});
                          }}
                          className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] hover:text-red-500 transition-colors"
                        >
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8 text-zinc-600 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-400 font-black text-[10px] uppercase tracking-widest">Select your syllabus PDF or Image</p>
                          <p className="text-zinc-700 font-bold text-[8px] uppercase tracking-widest">AI will extract topics for precise scheduling</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Brain className="w-3 h-3" /> Key Subjects
                  </Label>
                  <Input 
                    placeholder="e.g. Physics, Math..."
                    value={config.subjects}
                    onChange={(e) => setConfig({...config, subjects: e.target.value})}
                    className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> Hours Per Day
                    </Label>
                    <div className="flex bg-black border-2 border-zinc-800 p-2 rounded-[1.5rem] shadow-inner">
                      {[2, 4, 6, 8].map(h => (
                        <button
                          key={h}
                          onClick={() => setConfig({ ...config, dailyHours: h })}
                          className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                            config.dailyHours === h 
                              ? 'bg-primary text-black shadow-2xl' 
                              : 'text-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Level
                    </Label>
                    <div className="flex bg-black border-2 border-zinc-800 p-2 rounded-[1.5rem] shadow-inner">
                      {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                        <button
                          key={l}
                          onClick={() => setConfig({ ...config, level: l as any })}
                          className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                            config.level === l 
                              ? 'bg-primary text-black shadow-2xl' 
                              : 'text-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          {l[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!isRefining && (
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button 
                    className="flex-1 h-16 md:h-24 text-lg md:text-2xl font-black rounded-[1.2rem] md:rounded-[2rem] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
                    onClick={handleGenerate}
                    disabled={!config.goal || !config.subjects}
                  >
                    Create My Plan
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-16 md:h-auto md:py-10 px-8 text-[10px] font-black rounded-[1.2rem] md:rounded-[2rem] border-zinc-800 bg-transparent text-zinc-500 uppercase tracking-widest hover:bg-zinc-900 transition-all flex items-center justify-center gap-3"
                    onClick={() => setIsRefining(true)}
                  >
                    Details <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {isRefining && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-8 border-t border-zinc-900">
                <div className="flex items-center gap-4 pb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-inner">2</div>
                  <h3 className="text-white font-black text-2xl uppercase tracking-tighter">More Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Test Date</Label>
                    <Input 
                      placeholder="e.g. Dec 20..."
                      value={config.deadline}
                      onChange={(e) => setConfig({...config, deadline: e.target.value})}
                      className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Style</Label>
                    <div className="flex bg-black border-2 border-zinc-800 p-2 rounded-[1.5rem] shadow-inner">
                      {['Visual', 'Reading', 'Mixed'].map(s => (
                        <button
                          key={s}
                          onClick={() => setConfig({ ...config, learningStyle: s })}
                          className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                            config.learningStyle === s 
                              ? 'bg-primary text-black shadow-2xl' 
                              : 'text-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Focus Areas</Label>
                  <Textarea 
                    placeholder="e.g. I work in the morning..."
                    value={config.constraints}
                    onChange={(e) => setConfig({...config, constraints: e.target.value})}
                    className="bg-black border-zinc-800 rounded-[1.5rem] p-8 font-bold text-white shadow-inner h-40 resize-none focus:border-primary/50 transition-all uppercase tracking-tight"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsRefining(false)} 
                    className="h-14 md:h-auto md:px-8 text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white border border-zinc-900 sm:border-none rounded-xl"
                  >
                    <ArrowUp className="w-4 h-4 mr-2" /> Show Less
                  </Button>
                  <Button 
                    className="flex-1 h-16 md:h-24 text-lg md:text-2xl font-black rounded-[1.2rem] md:rounded-[2rem] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
                    onClick={handleGenerate}
                  >
                    Create Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'optimizing' && <TimetableSkeleton />}

        {status === 'success' && result && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 border-t border-zinc-900">
            <div className="bg-primary p-6 md:p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-2xl shadow-primary/20">
              <div className="bg-black/10 p-4 md:p-6 rounded-3xl">
                <Brain className="w-12 h-12 md:w-16 md:h-16 text-black" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <p className="text-black font-black text-[10px] uppercase tracking-[0.3em] opacity-60">AI Advice</p>
                <h3 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter leading-tight">Your Plan</h3>
                <MathText className="text-black/80 font-bold text-xs md:text-sm leading-relaxed max-w-3xl" content={result.mentorAdvice} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-[#0c0c0c] border border-zinc-800 p-10 rounded-[2.5rem] space-y-8 shadow-xl">
                <h3 className="text-white font-black text-2xl uppercase tracking-widest border-b border-zinc-800 pb-4 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-primary" /> Daily
                </h3>
                <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-p:font-bold prose-p:text-sm prose-li:text-zinc-400 prose-li:text-sm prose-headings:text-white prose-headings:uppercase prose-headings:tracking-tighter">
                  <MathText>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.timetableMarkdown}
                    </ReactMarkdown>
                  </MathText>
                </div>
              </div>

              <div className="bg-[#0c0c0c] border border-zinc-800 p-10 rounded-[2.5rem] space-y-8 shadow-xl">
                <h3 className="text-white font-black text-2xl uppercase tracking-widest border-b border-zinc-800 pb-4 flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" /> Roadmap
                </h3>
                <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-p:font-bold prose-p:text-sm prose-li:text-zinc-400 prose-li:text-sm prose-headings:text-white prose-headings:uppercase prose-headings:tracking-tighter">
                  <MathText>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.roadmapMarkdown}
                    </ReactMarkdown>
                  </MathText>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-white font-black text-3xl uppercase tracking-tighter border-b border-zinc-800 pb-4">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3 text-red-500">
                    <Youtube className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">YouTube</span>
                  </div>
                  <div className="space-y-4">
                    {result.resources.youtube.map((res: any, i: number) => (
                      <div key={i} className="bg-black/40 p-4 rounded-xl border border-zinc-800 group hover:border-red-500/50 transition-all">
                        <p className="text-white font-black text-[10px] uppercase tracking-widest mb-1">{res.title}</p>
                        <a href={res.link} target="_blank" className="text-[8px] text-red-500 font-black uppercase tracking-widest flex items-center gap-1">Watch <ArrowRight className="w-2 h-2" /></a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3 text-blue-500">
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reading</span>
                  </div>
                  <div className="space-y-4">
                    {result.resources.documentation.map((res: any, i: number) => (
                      <div key={i} className="bg-black/40 p-4 rounded-xl border border-zinc-800 group hover:border-blue-500/50 transition-all">
                        <p className="text-white font-black text-[10px] uppercase tracking-widest mb-2">{res.title}</p>
                        <a href={res.link} target="_blank" className="text-[8px] text-blue-500 font-black uppercase tracking-widest flex items-center gap-1">Read <ArrowRight className="w-2 h-2" /></a>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[2rem] space-y-6">
                  <div className="flex items-center gap-3 text-primary">
                    <Github className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Projects</span>
                  </div>
                  <div className="space-y-4">
                    {result.resources.github.map((res: any, i: number) => (
                      <div key={i} className="bg-black/40 p-4 rounded-xl border border-zinc-800 group hover:border-primary/50 transition-all">
                        <p className="text-white font-black text-[10px] uppercase tracking-widest mb-2">{res.title}</p>
                        <a href={res.link} target="_blank" className="text-[8px] text-primary font-black uppercase tracking-widest flex items-center gap-1">Open <ArrowRight className="w-2 h-2" /></a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => setStatus('idle')}
              className="w-full h-20 border-zinc-800 bg-transparent text-zinc-500 font-black uppercase tracking-widest rounded-[2rem] hover:bg-zinc-900 hover:text-white transition-all"
            >
              Start New Plan
            </Button>
          </div>
        )}
      </FadeTransition>
    </div>
  );
}
