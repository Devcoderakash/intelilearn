import { useState, useEffect, useRef } from 'react';
import { Youtube, AlignLeft, List, Clock, PlayCircle, Search, Sparkles, Loader2, MessageSquare, Send, User, Bot, X, MessageCircle, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { analyzeVideo, simpleAnalyzeVideo, chatWithVideo } from "@/ai/flows/video-analysis-flow";
import { FadeTransition, SectionHeader, ToastError } from './premium-ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { MathText } from './math-text';
import { useHistory } from '@/hooks/use-history';
import { supabase } from '@/lib/supabase';

export function VideoAnalyzer({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'success'>('idle');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, saveHistory } = useHistory();

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (initialState?.module_type === 'video' && initialState.input_data?.url) {
      setUrl(initialState.input_data.url);
      if (initialState.ai_output?.fullData) {
        setData(initialState.ai_output.fullData);
        setStatus('success');
      }
    }
  }, [initialState]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatOpen]);

  // REUSABLE SAVE LOGIC
  const saveToKnowledgeBase = async (summary: string, title: string) => {
    if (!user) return;
    try {
      await fetch('/api/notes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: summary,
          title: title,
          userId: user.id,
          metadata: { source: 'youtube', type: 'video_summary', auto_synced: true }
        })
      });
      console.log("[Intelligence] Data Synced Successfully.");
    } catch (err) {
      console.warn("[Intelligence] Sync encounterred a network drift.");
    }
  };

  // DEEP ANALYSIS HANDLER (Hoisted/Defined before call)
  const handleAiDeepSummary = async (targetData?: any) => {
    const currentData = targetData || data;
    if (!currentData?.url && !url) return;
    setIsAiLoading(true);
    try {
      const result = await analyzeVideo({ url: url || currentData.url });
      
      setData(prev => ({
        ...prev,
        summary: result.summary,
        keyPoints: result.keyPoints,
        timestamps: result.timestamps,
        isAiDeep: true
      }));

      // AUTO-SAVE DEEP SUMMARY
      if (result.summary) {
        await saveToKnowledgeBase(result.summary, result.title || currentData.title || "AI Research Note");
      }
    } catch (err: any) {
      console.error("Deep Sync Failed", err);
      setError("Deep intelligence node timed out. Reverting to base stream.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setStatus('analyzing');
    setError(null);
    setChatHistory([]);
    try {
      const result = await simpleAnalyzeVideo({ url });
      setData(result);
      setStatus('success');
      
      // Save to History (Standard)
      saveHistory({
        module_type: 'video',
        input_data: { url },
        ai_output: { 
          title: result.title, 
          summary: result.summary?.slice(0, 200),
          fullData: result 
        },
        readiness_score: 90 
      }).catch(console.error);

      // AUTO-SAVE INITIAL ANALYSIS
      if (result.summary) {
        saveToKnowledgeBase(result.summary, result.title || "Base Video Scan");
      }

      onAction();
      
      // TRIGGER AUTO-DEEP ANALYSIS IMMEDIATELY
      handleAiDeepSummary(result);
      
    } catch (err: any) {
      console.error("Analysis Pipeline Crash", err);
      setError(err.message || "Decoding failed. Check video source.");
      setStatus('idle');
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim() || !data?.transcript || isChatLoading) return;
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const res = await chatWithVideo({
        videoId: data.id,
        transcript: data.transcript,
        message: userMsg,
        history: chatHistory
      });
      setChatHistory(prev => [...prev, { role: 'model', content: res.response }]);
    } catch (err) {
      setError("Neural link unstable. Retry transmission.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const AnalysisSkeleton = () => (
    <div className="space-y-12 animate-pulse max-w-4xl mx-auto w-full pt-10">
      <Skeleton className="aspect-video w-full bg-zinc-900 rounded-[2.5rem]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-40 rounded-3xl bg-zinc-900" />
        <Skeleton className="h-40 rounded-3xl bg-zinc-900" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl bg-zinc-900" />
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4">
      {error && <ToastError message={error} />}
      
      <div className="flex-1 flex flex-col md:flex-row gap-6 bg-transparent overflow-hidden">
        <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-[2.5rem] border border-zinc-900 overflow-hidden relative shadow-2xl">
          <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full">
                <SectionHeader 
                  title="Video Intelligence" 
                  subtitle="Autonomous extraction and deep knowledge sync activated."
                  icon={Youtube}
                />
                
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-3xl mx-auto w-full mb-8 md:mb-12 mt-6 md:mt-8 px-1 md:px-0">
                  <div className="relative flex-1">
                    <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
                    <Input 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Drop YouTube intel link..."
                      className="pl-14 bg-zinc-900/50 border-zinc-800 h-14 md:h-16 rounded-2xl text-white placeholder:text-zinc-700 focus-visible:ring-primary/20 text-md md:text-lg shadow-inner w-full"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  <Button onClick={handleAnalyze} disabled={status === 'analyzing' || !url.trim()} className="w-full sm:w-auto px-10 h-14 md:h-16 font-black rounded-2xl text-md md:text-lg tracking-tight bg-primary text-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {status === 'analyzing' ? 'Processing...' : <><Search className="w-5 h-5 mr-3" /> Analyze</>}
                  </Button>
                </div>
                
                <FadeTransition viewKey={status}>
                  {status === 'idle' && (
                    <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center space-y-6 md:space-y-10">
                      <div className="w-20 h-20 md:w-28 md:h-28 bg-zinc-900 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center border border-zinc-800 shadow-inner group">
                        <PlayCircle className="w-10 h-10 md:w-14 md:h-14 text-zinc-700 group-hover:text-primary transition-colors" />
                      </div>
                      <div className="space-y-3 md:space-y-4 px-4">
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">System Idle</h3>
                        <p className="text-zinc-500 text-base md:text-lg max-w-sm mx-auto font-medium leading-relaxed">Awaiting video stream for autonomous synchronization.</p>
                      </div>
                    </div>
                  )}
  
                  {status === 'analyzing' && <AnalysisSkeleton />}
  
                  {status === 'success' && data && (
                    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pt-4 md:pt-6 pb-20">
                      <div className="rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-2 md:border-4 border-zinc-900 aspect-video ring-1 ring-white/5 bg-black">
                        <iframe
                          ref={iframeRef}
                          id="video-player-frame"
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${data.id}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                          title="Intelligence Stream"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
  
                      <div className="bg-[#0c0c0c] rounded-[1.5rem] md:rounded-[2.5rem] border border-zinc-900 overflow-hidden shadow-2xl ring-1 ring-white/5">
                        <Tabs defaultValue="summary" className="w-full flex flex-col">
                          <TabsList className="w-full h-auto bg-black p-1 rounded-none border-b border-zinc-900 grid grid-cols-2 sm:flex sm:flex-wrap">
                            <TabsTrigger value="summary" className="flex-1 rounded-xl md:rounded-2xl gap-2 font-black data-[state=active]:bg-zinc-900 data-[state=active]:text-primary text-[9px] md:text-[10px] uppercase tracking-widest py-3 md:py-4"><AlignLeft className="w-3.5 h-3.5" /> Summary</TabsTrigger>
                            <TabsTrigger value="points" className="flex-1 rounded-xl md:rounded-2xl gap-2 font-black data-[state=active]:bg-zinc-900 data-[state=active]:text-primary text-[9px] md:text-[10px] uppercase tracking-widest py-3 md:py-4"><List className="w-3.5 h-3.5" /> Points</TabsTrigger>
                            <TabsTrigger value="timestamps" className="flex-1 rounded-xl md:rounded-2xl gap-2 font-black data-[state=active]:bg-zinc-900 data-[state=active]:text-primary text-[9px] md:text-[10px] uppercase tracking-widest py-3 md:py-4"><Clock className="w-3.5 h-3.5" /> Timeline</TabsTrigger>
                            <TabsTrigger value="transcript" className="flex-1 rounded-xl md:rounded-2xl gap-2 font-black data-[state=active]:bg-zinc-900 data-[state=active]:text-primary text-[9px] md:text-[10px] uppercase tracking-widest py-3 md:py-4"><FileText className="w-3.5 h-3.5" /> Source</TabsTrigger>
                          </TabsList>
                          
                          <div className="p-5 md:p-12">
                            <TabsContent value="summary" className="mt-0 space-y-6 md:space-y-8 animate-in fade-in duration-500">
                              {isAiLoading && (
                                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-pulse">
                                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Synthesis in Progress...</span>
                                </div>
                              )}
                              
                              <div className="prose prose-invert max-w-none prose-p:text-base md:prose-p:text-xl prose-p:leading-relaxed prose-p:text-zinc-300 prose-headings:text-white prose-strong:text-primary prose-li:text-zinc-300 prose-blockquote:border-primary/50 prose-blockquote:bg-primary/5 prose-blockquote:rounded-xl md:prose-blockquote:rounded-2xl prose-blockquote:p-4 md:prose-blockquote:p-6 shadow-sm">
                                <MathText>
                                  <ReactMarkdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({node, children, ...props}) => {
                                        const content = String(children);
                                        if (content.includes('$$')) {
                                          return <div className="my-6 md:my-10 text-center" {...props}>{children}</div>;
                                        }
                                        return <p className="mb-6 md:mb-8 last:mb-0" {...props}>{children}</p>;
                                      },
                                      blockquote: ({node, ...props}) => <blockquote className="my-6 md:my-10 border-l-4" {...props} />,
                                      code: ({node, className, children, ...props}) => {
                                        const content = String(children);
                                        const match = /language-(\w+)/.exec(className || '');
                                        if (!match && (content.includes('\\') || content.includes('$'))) {
                                           const encoded = encodeURIComponent(content.replace(/\\\\/g, '\\'));
                                           return (
                                             <div className="my-4 text-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                                                <img 
                                                  src={`https://latex.codecogs.com/svg.latex?\\small\\color{white}${encoded}`} 
                                                  alt="Formula" 
                                                  className="mx-auto max-w-full"
                                                />
                                             </div>
                                           );
                                        }
                                        return <code className={cn("text-xs md:text-sm whitespace-pre-wrap break-all", className)} {...props}>{children}</code>;
                                      },
                                      pre: ({node, ...props}) => <pre className="bg-black/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-zinc-900 my-6 md:my-8 overflow-x-auto shadow-inner" {...props} />,
                                      h1: ({node, children, ...props}) => (
                                        <h1 className="text-3xl md:text-4xl font-black mb-6 md:mb-10 text-white uppercase tracking-tighter" {...props}>
                                          <MathText>{children}</MathText>
                                        </h1>
                                      ),
                                      h2: ({node, children, ...props}) => (
                                        <h2 className="text-2xl md:text-3xl font-black mb-5 md:mb-8 text-white uppercase tracking-tight" {...props}>
                                          <MathText>{children}</MathText>
                                        </h2>
                                      ),
                                      h3: ({node, children, ...props}) => (
                                        <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6 text-white" {...props}>
                                          <MathText>{children}</MathText>
                                        </h3>
                                      ),
                                      hr: ({node, ...props}) => <hr className="my-8 md:my-12 border-zinc-800" {...props} />
                                    }}
                                  >
                                    {String(data.summary || "No summary available.")}
                                  </ReactMarkdown>
                                </MathText>
                              </div>
                              
                              {data.recommendations && data.recommendations.length > 0 && (
                                <div className="mt-8 md:mt-12 space-y-6">
                                  <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <Sparkles className="w-5 h-5 text-primary" /> Recommendation Pipeline
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    {data.recommendations.map((rec: any, idx: number) => (
                                      <a 
                                        key={idx} 
                                        href={rec.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-primary/50 transition-all group flex flex-col gap-2"
                                      >
                                        <p className="text-xs font-bold text-zinc-300 group-hover:text-primary transition-colors line-clamp-2">{rec.title}</p>
                                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black flex items-center gap-1">
                                          Stream Now <PlayCircle className="w-3 h-3" />
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </TabsContent>
  
                            <TabsContent value="points" className="mt-0 space-y-6 md:space-y-8 animate-in fade-in duration-500">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                                {data.keyPoints?.map((p: string, i: number) => (
                                  <div key={i} className="p-5 md:p-6 bg-zinc-900/40 rounded-2xl md:rounded-3xl border border-zinc-800 flex gap-4 items-start group hover:border-primary/30 transition-all shadow-sm">
                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 shadow-inner border border-primary/10">
                                      <span className="text-primary text-[10px] font-black">{i + 1}</span>
                                    </div>
                                    <p className="text-zinc-300 font-medium leading-relaxed text-sm md:text-base">{p}</p>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
  
                            <TabsContent value="timestamps" className="mt-0 space-y-4 md:space-y-8 animate-in fade-in duration-500">
                              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                                {data.timestamps?.map((ts: any, i: number) => (
                                  <button 
                                    key={i} 
                                    onClick={() => {
                                      const timeParts = ts.time.split(':').map(Number);
                                      let seconds = 0;
                                      if (timeParts.length === 3) {
                                        seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                                      } else if (timeParts.length === 2) {
                                        seconds = timeParts[0] * 60 + timeParts[1];
                                      }
                                      
                                      if (iframeRef.current) {
                                        iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                                          event: 'command',
                                          func: 'seekTo',
                                          args: [seconds, true]
                                        }), '*');
                                        iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                                          event: 'command',
                                          func: 'playVideo',
                                          args: []
                                        }), '*');
                                      }
                                    }}
                                    className="p-3 bg-black/40 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 hover:border-primary/50 hover:bg-zinc-900 group transition-all text-center sm:text-left"
                                  >
                                    <span className="text-primary font-black bg-primary/10 px-2 sm:px-3 py-1 rounded-lg text-[10px] group-hover:bg-primary group-hover:text-black transition-all shrink-0">{ts.time}</span>
                                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-tight group-hover:text-white transition-colors leading-tight line-clamp-1">{ts.label}</p>
                                  </button>
                                ))}
                              </div>
                            </TabsContent>
  
                            <TabsContent value="transcript" className="mt-0 space-y-4 md:space-y-8 animate-in fade-in duration-500">
                              <div className="bg-black/50 p-5 md:p-8 rounded-2xl md:rounded-3xl border border-zinc-900 max-h-[300px] md:max-h-[400px] overflow-y-auto shadow-inner">
                                <p className="text-[9px] md:text-[10px] text-zinc-600 leading-loose whitespace-pre-wrap font-mono uppercase tracking-widest">
                                  {data.transcript}
                                </p>
                              </div>
                            </TabsContent>
                          </div>
                        </Tabs>
                      </div>
  
                      <div className="flex justify-center">
                        <Button variant="ghost" onClick={() => setStatus('idle')} className="text-zinc-700 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all">
                          Reset Analysis Sequence
                        </Button>
                      </div>
                    </div>
                  )}
                </FadeTransition>
              </div>
          </ScrollArea>
          
          <div className="px-10 py-4 bg-black border-t border-zinc-900/50 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Autonomous Sync: {status === 'success' ? 'Active' : 'Standby'}</span>
             </div>
             <p className="text-[9px] font-black text-zinc-800 uppercase tracking-widest">Neural Scan v9.4</p>
          </div>
        </div>
      </div>

      {/* FLOATING CHATBOT UI */}
      {status === 'success' && data && (
        <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[200] flex flex-col items-end gap-4">
          <FadeTransition viewKey={isChatOpen}>
            {isChatOpen && (
              <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[450px] sm:h-[500px] bg-zinc-950 border border-zinc-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-10 duration-500 ring-1 ring-white/5">
                <div className="p-5 sm:p-6 bg-zinc-900/50 border-b border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl border border-primary/20">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-tight">AI Companion</h3>
                      <p className="text-[7px] sm:text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">Contextual Analysis Active</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                    <div className="space-y-6">
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-zinc-600" />
                        </div>
                        <div className="bg-zinc-900/50 p-4 rounded-2xl rounded-tl-none border border-zinc-800">
                          <p className="text-zinc-300 text-xs font-medium leading-relaxed">System ready. Ask anything about the analysis.</p>
                        </div>
                      </div>

                      {chatHistory.map((chat, i) => (
                        <div key={i} className={cn("flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-300", 
                          chat.role === 'user' ? "flex-row-reverse" : ""
                        )}>
                          <div className={cn("w-8 h-8 rounded-lg border flex items-center justify-center shrink-0",
                            chat.role === 'user' ? "bg-primary/10 border-primary/20" : "bg-zinc-900 border-zinc-800"
                          )}>
                            {chat.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-zinc-600" />}
                          </div>
                          <div className={cn("p-4 rounded-2xl border max-w-[85%]",
                            chat.role === 'user' 
                              ? "bg-primary/5 border-primary/20 rounded-tr-none text-right" 
                              : "bg-zinc-900/50 border-zinc-800 rounded-tl-none"
                          )}>
                            <MathText className={cn("text-xs font-medium leading-relaxed",
                              chat.role === 'user' ? "text-primary/90" : "text-zinc-300"
                            )}>
                              {chat.content}
                            </MathText>
                          </div>
                        </div>
                      ))}

                      {isChatLoading && (
                        <div className="flex gap-3 items-start animate-pulse">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                            <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />
                          </div>
                          <div className="bg-zinc-900/50 p-4 rounded-2xl rounded-tl-none border border-zinc-800">
                            <div className="flex gap-1">
                              <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce" />
                              <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1 h-1 bg-zinc-700 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                </ScrollArea>

                <div className="p-6 pt-0 mt-auto">
                  <div className="relative group">
                    <Input 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                      placeholder="Ask a question..."
                      className="bg-black border-zinc-800 h-14 pr-14 rounded-2xl text-white placeholder:text-zinc-700 text-xs focus:ring-primary/20 transition-all shadow-inner"
                    />
                    <button 
                      onClick={handleChat}
                      disabled={isChatLoading || !chatMessage.trim()}
                      className="absolute right-2 top-2 w-10 h-10 bg-primary hover:bg-primary/90 text-black rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </FadeTransition>

          <Button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-16 h-16 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 flex items-center justify-center ring-4 ring-[#0a0a0a]",
              isChatOpen ? "bg-zinc-900 text-white rotate-90" : "bg-primary text-black shadow-primary/40"
            )}
          >
            {isChatOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
          </Button>
        </div>
      )}
    </div>
  );
}
