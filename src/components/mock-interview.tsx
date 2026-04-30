'use client';

import { useState, useEffect } from 'react';
import { UserRound, Plus, FileQuestion, Activity, Star, Send, CheckCircle2, Trophy, Brain, Target } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader, ToastError, FadeTransition } from './premium-ui';
import { generateInterviewQuestions, evaluateInterview } from "@/ai/flows/interview-flow";
import { MathText } from './math-text';
import { useHistory } from '@/hooks/use-history';

export function MockInterview({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const { saveHistory } = useHistory();
  const [status, setStatus] = useState<'idle' | 'loading_questions' | 'interviewing' | 'evaluating' | 'finished'>('idle');
  const [config, setConfig] = useState({ role: '', topic: '', difficulty: 'Medium', company: '' });
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (initialState?.module_type === 'performance' && initialState.ai_output?.fullData) {
      setConfig(prev => ({ ...prev, ...initialState.input_data }));
      setFeedback(initialState.ai_output.fullData);
      setQuestions(initialState.ai_output.fullData.questions || []); // Assuming questions are part of fullData
      setAnswers(initialState.ai_output.fullAnswers || []);
      setStatus('finished');
    }
  }, [initialState]);

  const handleStart = async () => {
    if (!config.role || !config.topic) return;
    setStatus('loading_questions');
    setError(null);
    try {
      const result = await generateInterviewQuestions({
        role: config.role,
        topic: config.topic,
        difficulty: config.difficulty as any,
        additionalContext: config.company ? `Target Company: ${config.company}` : undefined
      });
      if (!result || !result.questions) throw new Error("Invalid response");
      setQuestions(result.questions);
      setAnswers(new Array(result.questions.length).fill(''));
      setStatus('interviewing');
      setCurrentQuestionIdx(0);
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setError("Server busy. Please try again soon.");
    }
  };

  const handleNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = currentAnswer;
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      handleFinish(newAnswers);
    }
  };

  const handleFinish = async (finalAnswers: string[]) => {
    setStatus('evaluating');
    try {
      const qAndA = questions.map((q, i) => ({
        question: q.question,
        answer: finalAnswers[i]
      }));
      const result = await evaluateInterview({
        role: config.role,
        topic: config.topic,
        questionsAndAnswers: qAndA
      });
      setFeedback(result);
      setStatus('finished');
      onAction();

      // Save to History
      saveHistory({
        module_type: 'performance',
        input_data: { 
          role: config.role, 
          topic: config.topic, 
          difficulty: config.difficulty,
          company: config.company 
        },
        ai_output: { 
          score: result.overallScore,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          feedback: result.feedback,
          fullData: result,
          questions, // Save questions
          fullAnswers: finalAnswers // Save answers
        },
        readiness_score: parseInt(result.overallScore) * 10
      });
    } catch (err) {
      console.error(err);
      setStatus('interviewing');
      setError("AI Error. Please try again.");
    }
  };

  const LoadingSkeleton = ({ text }: { text: string }) => (
    <div className="bg-[#0c0c0c] border border-zinc-800/50 rounded-[2.5rem] p-20 flex flex-col items-center justify-center min-h-[500px] shadow-2xl space-y-10 animate-pulse">
      <Skeleton className="w-24 h-24 rounded-3xl bg-zinc-900" />
      <div className="space-y-4 w-full max-w-md">
        <Skeleton className="h-8 w-full bg-zinc-900 mx-auto" />
        <p className="text-zinc-600 font-black uppercase text-center tracking-[0.2em]">{text}</p>
        <Skeleton className="h-4 w-2/3 bg-zinc-900 mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pt-6 relative pb-20">
      {error && <ToastError message={error} />}
      
      <FadeTransition viewKey={status} className="w-full">
        {status === 'idle' && (
          <div className="space-y-10">
            <SectionHeader 
              title="Practice Interview" 
              subtitle="Practice for your next job with AI questions and get feedback instantly."
              icon={UserRound}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-[#0c0c0c] border border-zinc-800/50 p-10 rounded-[2.5rem] space-y-10 shadow-2xl">
                <div className="flex items-center gap-4 border-b border-zinc-800/50 pb-8">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Setup Your Session</h3>
                </div>
                
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Job Role</Label>
                      <Input 
                        placeholder="e.g. Software Engineer..."
                        value={config.role}
                        onChange={(e) => setConfig({...config, role: e.target.value})}
                        className="bg-black border-zinc-800 h-16 rounded-2xl px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Main Topic</Label>
                      <Input 
                        placeholder="e.g. React, Java..."
                        value={config.topic}
                        onChange={(e) => setConfig({...config, topic: e.target.value})}
                        className="bg-black border-zinc-800 h-16 rounded-2xl px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                      <Target className="w-3 h-3" /> Target Company (Optional)
                    </Label>
                    <Input 
                      placeholder="e.g. Google, Startup..."
                      value={config.company}
                      onChange={(e) => setConfig({...config, company: e.target.value})}
                      className="bg-black border-zinc-800 h-16 rounded-2xl px-8 font-black text-white shadow-inner border-2 uppercase tracking-tight focus:border-primary/50 transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Difficulty</Label>
                    <div className="flex bg-black border-2 border-zinc-800 p-2 rounded-[1.5rem] shadow-inner">
                      {['Easy', 'Medium', 'Hard'].map(d => (
                        <button
                          key={d}
                          onClick={() => setConfig({ ...config, difficulty: d })}
                          className={`flex-1 py-4 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                            config.difficulty === d 
                              ? 'bg-primary text-black shadow-2xl scale-[1.02]' 
                              : 'text-zinc-600 hover:text-zinc-300'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full py-8 md:py-10 text-xl md:text-2xl font-black rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
                  onClick={handleStart}
                  disabled={!config.role || !config.topic}
                >
                  Start Practice
                </Button>
              </div>

              <div className="space-y-8">
                <div className="bg-[#0c0c0c] border border-zinc-800/50 p-10 rounded-[2.5rem] h-full shadow-lg space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-6">How it works</h3>
                    <p className="text-sm text-zinc-500 font-bold leading-relaxed tracking-tight">
                      The AI will ask you questions. You answer, and we grade your performance.
                    </p>
                  </div>
                  <ul className="space-y-10">
                    <li className="flex items-center gap-5 group">
                      <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-all border border-purple-500/20 shadow-inner">
                        <FileQuestion className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-white font-black text-[10px] uppercase tracking-widest">Smart Questions</p>
                        <p className="text-[10px] text-zinc-600 font-black mt-1 uppercase">Role-based questions.</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-5 group">
                      <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-all border border-blue-500/20 shadow-inner">
                        <Activity className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white font-black text-[10px] uppercase tracking-widest">Real Time</p>
                        <p className="text-[10px] text-zinc-600 font-black mt-1 uppercase">Instant practice.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'loading_questions' && <LoadingSkeleton text="Preparing questions..." />}

        {status === 'interviewing' && questions.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black">
                  {currentQuestionIdx + 1}/{questions.length}
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Question</p>
                  <p className="text-white font-black uppercase text-xs truncate max-w-[200px]">{config.role}</p>
                </div>
              </div>
              <div className="w-48 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-[#0c0c0c] border-2 border-primary/20 p-12 rounded-[2.5rem] shadow-2xl shadow-primary/5 space-y-10">
              <div className="space-y-4">
                <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em]">Interviewer:</p>
                <MathText 
                  className="text-2xl md:text-4xl font-black text-white uppercase tracking-tight leading-tight"
                  content={questions[currentQuestionIdx].question}
                />
                <p className="text-zinc-500 font-bold text-xs md:text-sm tracking-tight border-l-2 border-zinc-800 pl-4 py-2">
                  {questions[currentQuestionIdx].context}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Your Answer</Label>
                <Textarea 
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="bg-black border-zinc-800 rounded-[1.5rem] p-8 font-bold text-white shadow-inner h-60 resize-none focus:border-primary/50 transition-all uppercase tracking-tight text-lg"
                />
              </div>

              <Button 
                className="w-full py-8 md:py-10 text-xl md:text-2xl font-black rounded-[1.5rem] md:rounded-[2rem] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
              >
                {currentQuestionIdx === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </Button>
            </div>
          </div>
        )}

        {status === 'evaluating' && <LoadingSkeleton text="Grading your session..." />}

        {status === 'finished' && feedback && (<>
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-primary p-8 md:p-10 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-primary/20">
                <Trophy className="w-12 h-12 md:w-16 md:h-16 text-black" />
                <div>
                  <p className="text-black font-black text-[10px] uppercase tracking-widest opacity-60">Your Score</p>
                  <p className="text-6xl md:text-7xl font-black text-black leading-none">{feedback.overallScore}<span className="text-2xl md:text-3xl opacity-40">/10</span></p>
                </div>
              </div>
              <div className="md:col-span-2 bg-[#0c0c0c] border border-zinc-800 p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center space-y-4">
                <h3 className="text-white font-black text-3xl uppercase tracking-tighter">Feedback</h3>
                <MathText 
                  className="text-zinc-400 font-bold leading-relaxed"
                  content={feedback.feedback}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[2.5rem] space-y-6">
                <h4 className="text-primary font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Good Points
                </h4>
                <ul className="space-y-4">
                  {feedback.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest bg-black/40 p-4 rounded-xl border border-zinc-800 shadow-inner">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800 p-10 rounded-[2.5rem] space-y-6">
                <h4 className="text-orange-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <Brain className="w-4 h-4" /> To Improve
                </h4>
                <ul className="space-y-4">
                  {feedback.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest bg-black/40 p-4 rounded-xl border border-zinc-800 shadow-inner">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <h3 className="text-white font-black text-2xl uppercase tracking-widest border-b border-zinc-800 pb-4">Detailed Review</h3>
              {questions.map((q, i) => {
                const item = feedback.detailedAnalysis.find((a: any) => a.question === q.question);
                if (!item) return null;
                return (
                  <div key={i} className="bg-[#0c0c0c] border border-zinc-800 p-8 rounded-[2.5rem] space-y-4">
                    <div className="flex justify-between items-start">
                      <p className="text-primary font-black uppercase text-[10px] tracking-widest">Question {i + 1}</p>
                      <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                        Score: {item.score}/10
                      </div>
                    </div>
                    <MathText 
                      className="text-white font-black text-lg uppercase tracking-tight"
                      content={q.question}
                    />
                    <MathText 
                      className="text-zinc-500 text-sm font-bold leading-relaxed"
                      content={item.evaluation}
                    />
                  </div>
                );
              })}
            </div>

            <Button 
              variant="outline" 
              onClick={() => setStatus('idle')}
              className="w-full h-20 border-zinc-800 bg-transparent text-zinc-500 font-black uppercase tracking-widest rounded-[2rem] hover:bg-zinc-900 hover:text-white transition-all"
            >
              Start New Session
            </Button>
          </div>
          <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
              <h3 className="text-white font-black text-2xl uppercase tracking-tighter flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" /> Performance Ledger
              </h3>
              <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Archive ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
            
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={idx} className="group overflow-hidden rounded-[2rem] border border-zinc-900 bg-[#070707] hover:border-primary/20 transition-all duration-500 shadow-xl">
                  {/* Question Header */}
                  <div className="bg-zinc-900/30 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-primary font-black text-xs shadow-inner">
                        {idx + 1}
                      </div>
                      <MathText 
                        className="text-zinc-100 font-bold uppercase tracking-tight text-sm md:text-md"
                        content={q.question}
                      />
                    </div>
                    <span className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] whitespace-nowrap">Session Node // 2026</span>
                  </div>

                  {/* Answers Comparison */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-8 border-b lg:border-b-0 lg:border-r border-zinc-900/50 space-y-4">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-3 h-3 text-zinc-600" />
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Your Input Path</span>
                      </div>
                      <div className="bg-black/40 p-6 rounded-2xl border border-zinc-800/50 min-h-[100px] shadow-inner">
                        <p className="text-zinc-400 text-sm font-medium leading-relaxed italic">"{answers[idx]}"</p>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-4 bg-primary/[0.01]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Gold Standard Response</span>
                      </div>
                      <div className="bg-primary/[0.03] p-6 rounded-2xl border border-primary/10 min-h-[100px] shadow-inner group-hover:border-primary/20 transition-colors">
                        <MathText 
                          className="text-zinc-200 text-sm font-bold leading-relaxed"
                          content={feedback.correctAnswers?.[idx] || 'Ideal response currently unavailable.'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>)}
      </FadeTransition>
    </div>
  );
}
