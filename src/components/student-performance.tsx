'use client';

import { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Github,
  Database,
  Plus,
  X,
  Target,
  Clock,
  FileText,
  Brain,
  Workflow,
  UploadCloud,
  FileUp,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader, FadeTransition, ToastError } from './premium-ui';
import { analyzePerformance } from "@/ai/flows/performance-analysis-flow";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MathText } from './math-text';
import { cn } from '@/lib/utils';
import { useHistory } from '@/hooks/use-history';

export function StudentPerformance({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const { user, saveHistory } = useHistory();
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [academicLinks, setAcademicLinks] = useState<string[]>(['']);
  const [externalLinks, setExternalLinks] = useState<string[]>(['']);
  const [fileDataUris, setFileDataUris] = useState<string[]>([]);
  const [selfAssessment, setSelfAssessment] = useState('');
  const [goal, setGoal] = useState('');
  const [timeline, setTimeline] = useState('');

  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialState?.module_type === 'performance' && initialState.ai_output?.fullData) {
      setAcademicLinks(initialState.input_data.studyLinks || ['']);
      setExternalLinks(initialState.input_data.portfolio?.split(', ') || ['']);
      setGoal(initialState.input_data.goal || '');
      setTimeline(initialState.input_data.timeline || '');
      setSelfAssessment(initialState.input_data.selfAssessment || '');
      setResult(initialState.ai_output.fullData);
      setStatus('success');
    }
  }, [initialState]);

  const handlePredict = async () => {
    setStatus('analyzing');
    setError(null);

    try {
      const payload = {
        studyLinks: academicLinks.filter(l => l.trim() !== ''),
        documents: fileDataUris, // Passing actual Base64 strings for AI processing
        portfolio: externalLinks.filter(l => l.trim() !== '').join(', '),
        goal,
        timeline,
        selfAssessment,
        userId: user?.id // Vital for background Knowledge Base Sync
      };

      const analysis = await analyzePerformance(payload);
      setResult(analysis);
      setStatus('success');
      onAction();

      // Save to History
      saveHistory({
        module_type: 'performance',
        input_data: payload,
        ai_output: {
          score: analysis.readinessScore,
          summary: analysis.summary,
          insights: analysis.keyInsights,
          fullData: analysis
        },
        readiness_score: parseInt(analysis.readinessScore) || 0
      });
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setError("AI busy. Please try again.");
    }
  };

  const addLink = (type: 'academic' | 'external') => {
    if (type === 'academic') setAcademicLinks([...academicLinks, '']);
    else setExternalLinks([...externalLinks, '']);
  };

  const removeLink = (type: 'academic' | 'external', index: number) => {
    if (type === 'academic') {
      const next = [...academicLinks];
      next.splice(index, 1);
      setAcademicLinks(next);
    } else {
      const next = [...externalLinks];
      next.splice(index, 1);
      setExternalLinks(next);
    }
  };

  const updateLink = (type: 'academic' | 'external', index: number, val: string) => {
    if (type === 'academic') {
      const next = [...academicLinks];
      next[index] = val;
      setAcademicLinks(next);
    } else {
      const next = [...externalLinks];
      next[index] = val;
      setExternalLinks(next);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileDataUris(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFileDataUris(prev => prev.filter((_, i) => i !== index));
  };

  const PerformanceSkeleton = () => (
    <div className="space-y-12 animate-pulse max-w-4xl mx-auto pt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton className="h-40 rounded-3xl bg-zinc-900" />
        <Skeleton className="md:col-span-2 h-40 rounded-3xl bg-zinc-900" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-96 rounded-3xl bg-zinc-900" />
        <Skeleton className="h-64 rounded-3xl bg-zinc-900" />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {error && <ToastError message={error} />}

      <FadeTransition viewKey={status}>
        {status === 'idle' && (
          <>
            <SectionHeader
              title="My Progress"
              subtitle="Get a study plan based on your goals and materials."
              icon={TrendingUp}
            />

            {!user ? (
              <div className="bg-zinc-950/50 border-2 border-dashed border-zinc-900 p-6 sm:p-12 md:p-20 rounded-[2rem] sm:rounded-[3rem] text-center space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-500 mx-auto w-full max-w-4xl">
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-zinc-900 rounded-[1.5rem] sm:rounded-[2.5rem] flex items-center justify-center border border-zinc-800 mx-auto shadow-inner">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-700" />
                </div>
                <div className="space-y-3 sm:space-y-4 max-w-md mx-auto px-2">
                  <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter">Identity Required</h3>
                  <p className="text-zinc-500 text-sm sm:text-lg font-medium leading-relaxed">Please authenticate to access personalized academic intelligence and sync your progress to the Knowledge Base.</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="w-full sm:w-auto px-12 h-14 sm:h-16 font-black rounded-xl sm:rounded-2xl text-base sm:text-lg bg-primary text-black shadow-2xl shadow-primary/20 hover:scale-[1.05] transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-3" /> Authenticate Me
                </Button>
              </div>
            ) : (
              <div className="bg-zinc-950/50 border border-zinc-900 p-8 rounded-3xl space-y-12 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-4 h-4" /> Study Links
                    </Label>
                    <Button variant="ghost" size="sm" onClick={() => addLink('academic')} className="text-[10px] text-primary hover:bg-primary/5 font-black uppercase">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Node
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {academicLinks.map((link, i) => (
                      <div key={i} className="relative group">
                        <Input
                          placeholder="Link to portal or grades..."
                          value={link}
                          onChange={(e) => updateLink('academic', i, e.target.value)}
                          className="bg-zinc-900 border-zinc-800 h-14 md:h-12 rounded-xl px-4 text-white placeholder:text-zinc-700 text-sm"
                        />
                        {academicLinks.length > 1 && (
                          <button onClick={() => removeLink('academic', i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                    <FileUp className="w-4 h-4" /> Inject Docs
                  </Label>
                  <div
                    className="border-2 border-dashed border-zinc-900 hover:border-primary/20 bg-zinc-900/10 rounded-2xl p-6 md:p-10 text-center cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[140px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="w-8 h-8 text-zinc-800 group-hover:text-primary mb-2 transition-colors" />
                    <p className="text-[10px] font-black text-zinc-600 uppercase group-hover:text-white transition-colors tracking-tighter">Upload notes or report cards</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Github className="w-4 h-4" /> Portfolio
                    </Label>
                    <Button variant="ghost" size="sm" onClick={() => addLink('external')} className="text-[10px] text-primary hover:bg-primary/5 font-black uppercase">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Node
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {externalLinks.map((link, i) => (
                      <div key={i} className="relative group">
                        <Input
                          placeholder="GitHub or website link..."
                          value={link}
                          onChange={(e) => updateLink('external', i, e.target.value)}
                          className="bg-zinc-900 border-zinc-800 h-14 md:h-12 rounded-xl px-4 text-white placeholder:text-zinc-700 text-sm"
                        />
                        {externalLinks.length > 1 && (
                          <button onClick={() => removeLink('external', i)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-4 h-4" /> Your Goal
                    </Label>
                    <Input
                      placeholder="e.g. Become a developer..."
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-14 md:h-12 rounded-xl px-4 text-white placeholder:text-zinc-700 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Timeline
                    </Label>
                    <Input
                      placeholder="e.g. 3 months..."
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 h-14 md:h-12 rounded-xl px-4 text-white placeholder:text-zinc-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Self-Assessment</Label>
                <Textarea
                  placeholder="Tell us about your current skills..."
                  value={selfAssessment}
                  onChange={(e) => setSelfAssessment(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 rounded-2xl p-6 text-white placeholder:text-zinc-700 h-32 resize-none"
                />
              </div>

              <Button onClick={handlePredict} className="w-full h-16 text-lg md:text-xl font-black uppercase tracking-tight rounded-[1.5rem] md:rounded-2xl bg-primary text-black transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl shadow-primary/20">
                Analyze My Progress
              </Button>
            </div>
          )}
          </>
        )}

        {status === 'analyzing' && <PerformanceSkeleton />}

        {status === 'success' && result && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-5xl mx-auto pt-10">
            {/* Header: Score & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-primary p-8 md:p-10 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-6 shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] border-b-8 border-primary/20">
                <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-2xl">
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-black/60 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Readiness Index</p>
                  <p className={cn(
                    "font-black text-black leading-none tracking-tighter break-words",
                    result.readinessScore.length > 5 ? "text-3xl" : "text-7xl"
                  )}>
                    {result.readinessScore}
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2 bg-[#0c0c0c] border-2 border-zinc-900 p-12 rounded-[3rem] flex flex-col justify-center space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Brain className="w-32 h-32 text-primary" />
                </div>
                <div className="space-y-4 relative">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Intelligence Summary</h3>
                  <div className="prose prose-invert max-w-none prose-p:text-xl md:prose-p:text-2xl prose-p:font-bold prose-p:text-zinc-100 prose-p:leading-tight prose-p:tracking-tight prose-strong:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.summary}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
                  {Object.entries(result.availableData).map(([key, val]) => (
                    <div key={key} className="space-y-2">
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", val === 'Yes' ? 'bg-emerald-500' : 'bg-red-500')} />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights & Risks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900/10 border border-zinc-800/50 p-10 rounded-[2.5rem] space-y-8 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">Performance Insights</h4>
                </div>
                <ul className="space-y-6">
                  {result.keyInsights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex gap-4 group">
                      <div className="mt-1 w-1.5 h-6 bg-emerald-500/20 rounded-full group-hover:bg-emerald-500 transition-colors shrink-0" />
                      <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-400 prose-p:font-bold prose-p:leading-relaxed prose-p:tracking-tight prose-strong:text-zinc-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {insight}
                        </ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-900/10 border border-zinc-800/50 p-10 rounded-[2.5rem] space-y-8 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <X className="w-5 h-5 text-red-500" />
                  </div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">Risk Analysis</h4>
                </div>
                <ul className="space-y-6">
                  {result.riskAnalysis.map((risk: string, idx: number) => (
                    <li key={idx} className="flex gap-4 group">
                      <div className="mt-1 w-1.5 h-6 bg-red-500/20 rounded-full group-hover:bg-red-500 transition-colors shrink-0" />
                      <div className="prose prose-invert prose-sm max-w-none prose-p:text-zinc-400 prose-p:font-bold prose-p:leading-relaxed prose-p:tracking-tight prose-strong:text-zinc-200">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {risk}
                        </ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Prediction & Skill Gaps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black border-2 border-primary/10 p-10 rounded-[2.5rem] space-y-6 shadow-inner relative overflow-hidden">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Trajectory Prediction</h4>
                  <div className="px-3 py-1 bg-primary/20 rounded-full text-[8px] font-black text-primary uppercase tracking-widest border border-primary/30">
                    Risk: {result.prediction.risk_level}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none prose-p:text-zinc-200 prose-p:text-lg prose-p:font-bold prose-p:leading-snug prose-p:tracking-tight prose-strong:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.prediction.performance_forecast}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: result.prediction.retention_probability }} />
                    </div>
                    <span className="text-[8px] font-black text-zinc-600 uppercase whitespace-nowrap">Retention: {result.prediction.retention_probability}</span>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[2.5rem] space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Inferred Skills & Strategy</h4>
                  <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Confidence: {result.profile.confidence_level}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.profile.inferred_skills.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 font-bold">
                      {s}
                    </span>
                  ))}
                </div>
                <MathText className="text-zinc-500 text-xs font-medium leading-relaxed italic" content={`Intent: ${result.profile.learning_intent}`} />
              </div>
            </div>

            {/* Action Plan (Full Width) */}
            <div className="bg-[#0c0c0c] border border-primary/20 p-12 rounded-[3rem] space-y-10 shadow-2xl relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 md:p-5 bg-primary/10 rounded-2xl md:rounded-3xl border border-primary/20">
                    <Workflow className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">Action Plan</h3>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Priority Extraction Complete</p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-p:text-lg prose-p:leading-relaxed prose-strong:text-white prose-li:text-zinc-400 marker:text-primary">
                <MathText>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.actionPlan}
                  </ReactMarkdown>
                </MathText>
              </div>
            </div>

            {/* Missing Data Suggestions */}
            <div className="bg-zinc-950/80 border border-zinc-900 border-dashed p-10 rounded-[2.5rem] text-center space-y-8">
              <div className="space-y-2">
                <h5 className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em]">Improve Analysis Accuracy</h5>
                <p className="text-zinc-600 font-bold text-sm tracking-tight">Expand student profile with the following data :</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {result.missingDataSuggestions.map((suggestion: string, idx: number) => (
                  <span key={idx} className="px-6 py-3 bg-zinc-900 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-800">
                    + {suggestion}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-10">
              <Button
                onClick={() => setStatus('idle')}
                className="group h-20 px-12 bg-zinc-900 hover:bg-white text-zinc-500 hover:text-black rounded-[2rem] border border-zinc-800 transition-all font-black uppercase tracking-widest text-xs flex items-center gap-4"
              >
                <LayoutDashboard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Initiate New Sequence
              </Button>
            </div>
          </div>
        )}
      </FadeTransition>
    </div>
  );
}
