'use client';

import { useState, useEffect } from 'react';
import { FileQuestion, FileText, CheckCircle2, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePYQs } from "@/ai/flows/pyq-flow";
import { FadeTransition, SectionHeader, ToastError } from './premium-ui';
import { MathText } from './math-text';
import { useHistory } from '@/hooks/use-history';

export function PYQEngine({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const { saveHistory } = useHistory();
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');
  const [testMode, setTestMode] = useState<'testing'|'results'>('testing');
  const [userAnswers, setUserAnswers] = useState<Record<number,string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({ 
    subject: '', 
    topic: '', 
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    classLevel: '',
    board: '',
    university: ''
  });

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (initialState?.module_type === 'test' && initialState.ai_output?.questions) {
      setConfig(initialState.input_data);
      setQuestions(initialState.ai_output.questions);
      setStatus('success');
      setTestMode('results'); // Show them the answers in history mode
    }
  }, [initialState]);

  const handleGenerate = async () => {
    if (!config.subject) return;
    setStatus('generating');
    setError(null);
    try {
      const result = await generatePYQs(config);
      if (!result || !result.questions) {
        throw new Error("Invalid response");
      }
      setQuestions(result.questions);
      setUserAnswers({});
      setTestMode('testing');
      setStatus('success');
      onAction();

      // Save to History
      saveHistory({
        module_type: 'test', 
        input_data: config,
        ai_output: { 
          count: result.questions.length,
          subject: config.subject,
          topic: config.topic,
          questions: result.questions
        },
        readiness_score: 100
      });
    } catch (err: any) {
      console.error("PYQ Generation Failed", err);
      setStatus('idle');
      setError("AI busy. Please try again soon.");
    }
  };

  const GeneratingSkeleton = () => (
    <div className="space-y-8 animate-pulse pt-10">
      <Skeleton className="h-20 w-full rounded-[2rem] bg-zinc-900" />
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[#0c0c0c] border border-zinc-800 rounded-[2.5rem] p-12 space-y-8">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-24 bg-zinc-900" />
            <Skeleton className="h-6 w-32 bg-zinc-900" />
          </div>
          <Skeleton className="h-10 w-3/4 bg-zinc-900" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14 bg-zinc-900 rounded-2xl" />
            <Skeleton className="h-14 bg-zinc-900 rounded-2xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-[2rem] bg-zinc-900" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pt-6 space-y-10 pb-20 relative">
      {error && <ToastError message={error} />}
      
      <div className="bg-[#0c0c0c] border border-zinc-800/50 p-10 rounded-[2.5rem] space-y-10 shadow-2xl">
        <SectionHeader 
          title="Practice Test Maker" 
          subtitle="Create practice tests with answers and simple explanations."
          icon={FileQuestion}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Subject</Label>
            <Input 
              placeholder="e.g. Math, History..."
              value={config.subject}
              onChange={(e) => setConfig({...config, subject: e.target.value})}
              className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-sm md:text-base"
            />
          </div>
          
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Specific Topic</Label>
            <Input 
              placeholder="e.g. Fractions..."
              value={config.topic}
              onChange={(e) => setConfig({...config, topic: e.target.value})}
              className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900/50">
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Grade / Year</Label>
            <Input 
              placeholder="e.g. Grade 10..."
              value={config.classLevel}
              onChange={(e) => setConfig({...config, classLevel: e.target.value})}
              className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-xs md:text-base"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Board</Label>
            <Input 
              placeholder="e.g. CBSE..."
              value={config.board}
              onChange={(e) => setConfig({...config, board: e.target.value})}
              className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-xs md:text-base"
            />
          </div>
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">School</Label>
            <Input 
              placeholder="e.g. Your School Name..."
              value={config.university}
              onChange={(e) => setConfig({...config, university: e.target.value})}
              className="bg-black border-zinc-800 h-14 md:h-16 rounded-2xl px-6 md:px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all text-xs md:text-base"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Difficulty</Label>
          <div className="flex bg-black border-2 border-zinc-800 p-2 rounded-[1.5rem] shadow-inner">
            {(['Easy', 'Medium', 'Hard'] as const).map(d => (
              <button
                key={d}
                onClick={() => setConfig({ ...config, difficulty: d })}
                className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                  config.difficulty === d ? 'bg-primary text-black shadow-2xl scale-[1.02]' : 'text-zinc-600 hover:text-zinc-300'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <Button 
          className="w-full py-8 md:py-10 text-xl md:text-2xl font-black rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
          onClick={handleGenerate} 
          disabled={status === 'generating' || !config.subject}
        >
          {status === 'generating' ? 'Making test...' : 'Create Practice Test'}
        </Button>
      </div>

      <div className="space-y-8">
        <FadeTransition viewKey={status} className="w-full">
          {status === 'idle' && (
            <div className="border border-zinc-800 rounded-[2.5rem] bg-zinc-900/30 flex flex-col items-center justify-center p-20 text-center h-[400px] shadow-2xl border-dashed">
              <div className="p-10 bg-zinc-800 rounded-[2rem] mb-8 ring-1 ring-zinc-700 shadow-inner">
                <FileText className="w-16 h-16 text-zinc-700" />
              </div>
              <p className="text-white font-black text-2xl uppercase tracking-tighter">No Test Created Yet</p>
              <p className="text-[10px] font-black text-zinc-600 mt-3 uppercase tracking-[0.3em]">Fill in the form to start</p>
            </div>
          )}

          {status === 'generating' && <GeneratingSkeleton />}

          {status === 'success' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 border-t border-zinc-900">
              <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 p-6 rounded-[2rem] shadow-lg">
                <div className="p-4 bg-primary/20 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-black text-xl uppercase tracking-tighter">Test Ready</h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">We made a practice test for you.</p>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className="bg-[#0c0c0c] border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl group transition-all hover:border-primary/30">
                  <div className="p-8 md:p-12 space-y-8">
                    <div className="flex justify-between items-start">
                      <span className="px-4 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Question {idx + 1} {q.year && `• ${q.year}`}
                      </span>
                      <span className="px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest">
                        {q.examContext}
                      </span>
                    </div>
                    
                    <MathText 
                      className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-snug"
                      content={q.question}
                    />

                    {q.options && q.options.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isSelected = userAnswers[idx] === opt;
                          const isCorrect = testMode === 'results' && opt === q.correctAnswer;
                          const isWrong = testMode === 'results' && isSelected && opt !== q.correctAnswer;
                          return (
                            <button 
                              key={optIdx} 
                              onClick={() => testMode === 'testing' && setUserAnswers({...userAnswers, [idx]: opt})}
                              className={`p-5 text-left border-2 rounded-2xl font-bold uppercase tracking-tight text-sm flex items-center gap-4 transition-all
                                ${testMode === 'testing' ? (isSelected ? 'bg-primary text-black border-primary' : 'bg-black border-zinc-900 text-zinc-400 hover:border-zinc-700') : ''}
                                ${isCorrect ? 'bg-green-500/20 text-green-500 border-green-500' : ''}
                                ${isWrong ? 'bg-red-500/20 text-red-500 border-red-500' : ''}
                                ${testMode === 'results' && !isCorrect && !isWrong ? 'bg-black border-zinc-900 text-zinc-600 opacity-50' : ''}
                              `}>
                              <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center text-[10px] font-black
                                ${testMode === 'testing' && isSelected ? 'bg-black text-primary' : 'bg-zinc-900 text-white'}
                                ${isCorrect ? 'bg-green-500 text-black' : ''}
                                ${isWrong ? 'bg-red-500 text-black' : ''}
                              `}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Your Answer</Label>
                        <textarea 
                          disabled={testMode === 'results'}
                          value={userAnswers[idx] || ''}
                          onChange={(e) => setUserAnswers({...userAnswers, [idx]: e.target.value})}
                          placeholder="Type your detailed answer here..."
                          className="w-full bg-black border-2 border-zinc-900 p-6 rounded-2xl text-white font-bold min-h-[120px] focus:border-primary transition-all resize-y disabled:opacity-50 outline-none uppercase tracking-tight"
                        />
                      </div>
                    )}

                    {testMode === 'results' && (
                      <div className="pt-8 border-t border-zinc-900/50 space-y-6 animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3 text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-xs font-black uppercase tracking-widest">Correct Answer: {q.correctAnswer}</span>
                        </div>
                        <div className="bg-zinc-900/30 p-8 rounded-[2rem] border border-zinc-800/50">
                          <div className="flex items-center gap-3 mb-4 text-zinc-500">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Explanation</span>
                          </div>
                          <MathText 
                            className="text-zinc-400 font-bold leading-relaxed tracking-tight text-sm"
                            content={q.explanation}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {testMode === 'testing' ? (
                <Button 
                  onClick={() => setTestMode('results')}
                  className="w-full py-10 text-2xl font-black rounded-[2.5rem] shadow-2xl bg-white text-black hover:bg-zinc-200 transition-all uppercase tracking-tight border-4 border-black ring-4 ring-white/10"
                >
                  Submit Test
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setStatus('idle')}
                  className="w-full h-20 border-zinc-800 bg-transparent text-zinc-500 font-black uppercase tracking-widest rounded-[2rem] hover:bg-zinc-900 hover:text-white transition-all"
                >
                  Create Another Test
                </Button>
              )}
            </div>
          )}
        </FadeTransition>
      </div>
    </div>
  );
}
