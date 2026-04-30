'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Brain, Bot, User, Sparkles, Mic, Volume2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { tutorChat } from "@/ai/flows/tutor-flow";
import { SectionHeader, ToastError } from './premium-ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MathText } from './math-text';
import { useHistory } from '@/hooks/use-history';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import { cn } from '@/lib/utils';

export function AiTutor({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const { saveHistory } = useHistory();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
   const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { startListening, transcript, isListening, speak, isSpeaking, stopSpeaking } = useVoiceAssistant();

  // Sync voice transcript to input
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    if (initialState?.module_type === 'tutor' && initialState.input_data && initialState.ai_output) {
      const userMsg = { role: 'user', content: initialState.input_data.query };
      const aiMsg = { role: 'ai', content: initialState.ai_output.response };
      setMessages([userMsg, aiMsg]);
    }
  }, [initialState]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      content: m.content
    }));

    setInput('');
    setLoading(true);
    setError(null);

    try {
      const result = await tutorChat({ 
        message: currentInput,
        history: history as any
      });
      setMessages(prev => [...prev, { role: 'ai', content: result.response }]);
      
      // Automatic Audio Feedback (TTS Plugin)
      if (result.response) speak(result.response);
      
      onAction();

      // Save to History (every response)
      saveHistory({
        module_type: 'tutor', 
        input_data: { query: currentInput },
        ai_output: { response: result.response },
        readiness_score: 100
      });
    } catch (err) {
      console.error(err);
      setError("Intelligence node busy. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const ChatSkeleton = () => (
    <div className="flex justify-start max-w-4xl mx-auto w-full mb-12 animate-in fade-in duration-500">
      <div className="flex gap-6 w-full">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-zinc-800 shadow-inner">
          <Bot className="w-6 h-6 text-zinc-700" />
        </div>
        <div className="flex-1 space-y-4 pt-2">
          <Skeleton className="h-5 w-3/4 bg-zinc-900 rounded-lg" />
          <Skeleton className="h-5 w-full bg-zinc-900 rounded-lg" />
          <Skeleton className="h-5 w-1/2 bg-zinc-900 rounded-lg" />
        </div>
      </div>
    </div>
  );

  const SUGGESTIONS = [
    "Explain Quantum Physics simply", 
    "How do transistors work?", 
    "Python Data Structures guide", 
    "Strategic Study techniques"
  ];

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {error && <ToastError message={error} />}

      <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-3xl border border-zinc-900 overflow-hidden relative shadow-sm">
        <ScrollArea className="flex-1">
          <div className="p-6 md:p-12 max-w-4xl mx-auto w-full">
            {/* Scrollable Header Pattern */}
            <SectionHeader 
              title="AI Study Partner" 
              subtitle="Get professional help with any topic. The AI understands complex concepts and breaks them down into strategic knowledge nodes."
              icon={MessageSquare}
            />
            
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center space-y-12 py-16">
                <div className="p-8 bg-primary/10 rounded-[2.5rem] animate-pulse border border-primary/20 shadow-2xl">
                  <Brain className="w-16 h-16 text-primary" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter">Initiate Learning Sequence</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto text-lg font-medium leading-relaxed">Ask any academic question to begin the extraction process.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2 md:px-4">
                  {SUGGESTIONS.map(s => (
                    <button 
                      key={s} 
                      onClick={() => setInput(s)}
                      className="px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-primary hover:border-primary/30 transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-inner"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-12 mt-8">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center border shadow-inner ${
                    m.role === 'user' ? 'bg-primary border-primary/50' : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    {m.role === 'user' ? <User className="w-5 h-5 md:w-6 md:h-6 text-black" /> : <Bot className="w-5 h-5 md:w-6 md:h-6 text-zinc-500" />}
                  </div>
                  <div className="flex-1 pt-2 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                        m.role === 'user' ? 'text-primary' : 'text-zinc-600'
                      }`}>
                        {m.role === 'user' ? 'Local Stream' : 'AI Node Output'}
                      </p>
                      {/* Professional Audio Stop Button */}
                      {m.role === 'ai' && isSpeaking && (
                        <button 
                          onClick={stopSpeaking}
                          className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all animate-pulse"
                        >
                          <Volume2 className="w-3 h-3" /> Stop Audio
                        </button>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none prose-p:text-zinc-200 prose-p:text-lg prose-p:leading-relaxed prose-headings:text-white prose-strong:text-white prose-li:text-zinc-300 prose-strong:text-primary">
                      {m.role === 'user' ? (
                        <p className="text-lg md:text-xl whitespace-pre-wrap text-white font-bold tracking-tight uppercase">{m.content}</p>
                      ) : (
                        <MathText>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </MathText>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && <ChatSkeleton />}
              <div ref={scrollRef} className="h-10" />
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 md:p-10 bg-black border-t border-zinc-900/50">
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1 w-full">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask a question..."
                className="w-full bg-zinc-900/50 border-zinc-800 h-14 md:h-16 rounded-2xl px-6 font-black text-white placeholder:text-zinc-800 focus-visible:ring-primary/20 text-md md:text-xl shadow-inner uppercase tracking-tight"
              />
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={startListening}
                className={cn(
                  "h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center transition-all border-2",
                  isListening 
                    ? "bg-primary border-primary text-black animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                    : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 active:scale-95"
                )}
                title="Voice Assistant"
              >
                <Mic className="w-6 h-6" />
              </button>

              <button 
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="h-14 w-14 md:h-16 md:w-16 rounded-2xl flex items-center justify-center bg-primary hover:bg-primary/90 text-black shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale"
                title="Send Message"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <p className="text-[9px] text-center text-zinc-800 mt-6 font-black uppercase tracking-[0.3em]">
            Institutional Warning: AI may generate inaccurate data. Verify critical information.
          </p>
        </div>
      </div>
    </div>
  );
}
