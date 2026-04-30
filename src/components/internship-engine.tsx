'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Brain, 
  Award, 
  ExternalLink, 
  User,
  Mail,
  MapPin,
  Code2,
  Lightbulb,
  Search,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, FadeTransition, ToastError } from './premium-ui';
import { analyzeCareerProfile } from "@/ai/flows/internship-flow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractText } from '@/lib/file-extraction';
import { useHistory } from '@/hooks/use-history';


export function InternshipEngine({ onAction, initialState }: { onAction: () => void, initialState?: any }) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'success'>('idle');
  const [skills, setSkills] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { saveHistory } = useHistory();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (initialState?.module_type === 'internship' && initialState.ai_output?.fullData) {
      setSkills(initialState.input_data.skills || '');
      setFileName(initialState.input_data.fileName || null);
      setResult(initialState.ai_output.fullData);
      setStatus('success');
    }
  }, [initialState]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!skills.trim() && !fileUri) {
      setError("Please add your skills or upload a file first.");
      return;
    }

    setStatus('searching');
    setError(null);

    let extractedText = "";
    let finalUri: string | null = fileUri;

    try {
      if (fileInputRef.current?.files?.[0]) {
         const file = fileInputRef.current.files[0];
         try {
            console.log("Attempting Client-Side JS extraction (PDF/DOCX/OCR)...");
            extractedText = await extractText(file);
            console.log("Local extraction successful. Length:", extractedText.length);
            // We still send the URI as primary for Gemini, but extractedText for Groq/OpenAI fallbacks
         } catch(e) {
            console.warn("Client-Side extraction failed. Relying solely on Multimodal LLM read.", e);
         }
      }

      const data = await analyzeCareerProfile({
        manualText: skills || undefined,
        resumeDataUri: finalUri || undefined,
        extractedText: extractedText || undefined
      });
      setResult(data);
      setStatus('success');
      
      // Save to History
      saveHistory({
        module_type: 'internship',
        input_data: { skills, fileName },
        ai_output: { 
          name: data.resume_analysis.name, 
          ats_score: data.ats_evaluation.ats_score, 
          internships_found: data.internships?.length,
          fullData: data 
        },
        readiness_score: data.ats_evaluation.ats_score || 85
      }).catch(console.error);

      onAction();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Intelligence node busy. Please try again.");
      setStatus('idle');
    }
  };

  const CareerSkeleton = () => (
    <div className="space-y-16 animate-pulse max-w-4xl mx-auto py-12">
      <div className="flex flex-col items-center gap-8">
        <Skeleton className="h-28 w-28 rounded-full bg-zinc-900 border-4 border-zinc-800" />
        <Skeleton className="h-12 w-80 bg-zinc-900 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton className="h-48 rounded-[2.5rem] bg-zinc-900" />
        <Skeleton className="md:col-span-2 h-48 rounded-[2.5rem] bg-zinc-900" />
      </div>
      <div className="grid grid-cols-2 gap-8">
         <Skeleton className="h-64 rounded-[2.5rem] bg-zinc-900" />
         <Skeleton className="h-64 rounded-[2.5rem] bg-zinc-900" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {error && <ToastError message={error} />}

      <div className="flex-1 flex flex-col bg-zinc-950/50 rounded-3xl border border-zinc-900 overflow-hidden relative shadow-sm">
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-12 max-w-4xl mx-auto w-full">
            <FadeTransition viewKey={status}>
              {status === 'idle' && (
                <div className="space-y-6 md:space-y-12">
                  <SectionHeader 
                    title="Career Advice" 
                    subtitle="Professional AI Career Architect. Study your profile for verified matching."
                    icon={Briefcase}
                  />
                  
                  <div className="bg-[#0c0c0c] border-2 border-zinc-900 p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
                    
                    <div className="space-y-6">
                      <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-1">Multimodal Input (PDF/JPG/PNG)</Label>
                      <div 
                        className="border-4 border-dashed border-zinc-800 hover:border-primary/50 bg-black/50 rounded-[2rem] md:rounded-[2.5rem] p-10 md:p-20 text-center cursor-pointer transition-all group flex flex-col items-center justify-center min-h-[250px] md:h-72 shadow-inner"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*,.pdf" 
                          onChange={handleFileUpload} 
                        />
                        {fileName ? (
                          <div className="space-y-4 md:space-y-6">
                            <FileText className="w-12 h-12 md:w-20 md:h-20 text-primary mx-auto animate-bounce" />
                            <p className="font-black text-xl md:text-3xl text-white uppercase tracking-tighter leading-none break-all">{fileName}</p>
                            <Badge variant="outline" className="border-primary/30 text-primary px-4 md:px-6 py-1 md:py-2 rounded-full uppercase font-black text-[8px] md:text-[10px] tracking-widest">Neural Stream Ready</Badge>
                          </div>
                        ) : (
                          <div className="space-y-4 md:space-y-6">
                            <div className="p-6 md:p-8 bg-zinc-900 rounded-[1.5rem] md:rounded-[2rem] group-hover:bg-primary/10 transition-all mx-auto w-max border border-zinc-800 group-hover:border-primary/20 shadow-inner">
                              <UploadCloud className="w-8 h-8 md:w-12 md:h-12 text-zinc-700 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xl md:text-2xl font-black text-zinc-600 group-hover:text-white transition-colors uppercase tracking-tighter">Inject Profile Protocol</p>
                            <p className="text-[8px] md:text-[10px] text-zinc-800 font-black uppercase tracking-[0.3em]">Full Multimodal Support</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-zinc-900"></div>
                        <span className="flex-shrink-0 mx-8 text-zinc-800 text-[10px] font-black tracking-[0.5em] uppercase">Manual Override</span>
                        <div className="flex-grow border-t border-zinc-900"></div>
                    </div>

                    <div className="space-y-6">
                      <Label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-1">Technical Skill Array</Label>
                      <div className="flex flex-col gap-4 md:gap-6">
                        <Input 
                          value={skills}
                          onChange={(e) => setSkills(e.target.value)}
                          placeholder="E.G. PYTHON, REACT..."
                          className="bg-zinc-900/50 border-zinc-800 h-16 md:h-20 rounded-[1.2rem] md:rounded-[1.5rem] px-6 md:px-10 font-black text-white placeholder:text-zinc-800 focus-visible:ring-primary/20 text-lg md:text-2xl shadow-inner uppercase tracking-tight"
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={status === 'searching'} className="w-full h-16 md:h-24 text-lg md:text-2xl font-black rounded-[1.2rem] md:rounded-[2rem] bg-primary text-black hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 uppercase tracking-tight">
                           <Search className="w-5 h-5 md:w-7 md:h-7 mr-3 md:mr-4" /> Initialize Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {status === 'searching' && <CareerSkeleton />}

              {status === 'success' && result && (
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
                  <SectionHeader 
                    title="Neural Career Report" 
                    subtitle="Proprietary analysis of your professional profile, ATS compatibility index, and live market nodes."
                    icon={Briefcase}
                  />
                  
                  <div className="flex flex-col items-center text-center space-y-8 pt-4">
                    <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-black shadow-2xl shadow-primary/30 border-8 border-black ring-8 ring-primary/5">
                      <User className="w-16 h-16" />
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">{result.resume_analysis.name || "Candidate Profile"}</h2>
                      <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-zinc-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                        {result.resume_analysis.contact.email && <span className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> {result.resume_analysis.contact.email}</span>}
                        {result.resume_analysis.contact.location && <span className="flex items-center gap-3"><MapPin className="w-4 h-4 text-primary" /> {result.resume_analysis.contact.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                    <div className="bg-primary p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4 shadow-2xl shadow-primary/30 border-2 border-black/10">
                      <TrendingUp className="w-10 h-10 md:w-16 md:h-16 text-black mb-2" />
                      <p className="text-black/60 font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em]">ATS Index Score</p>
                      <p className="text-6xl md:text-9xl font-black text-black leading-none tracking-tighter">{result.ats_evaluation.ats_score}</p>
                    </div>
                    <div className="md:col-span-2 bg-[#0c0c0c] border-2 border-zinc-900 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] flex flex-col justify-center space-y-8 md:space-y-10 shadow-inner relative overflow-hidden">
                      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />
                      <div className="flex items-center gap-4 text-primary border-b border-zinc-900 pb-4 md:pb-6">
                        <Award className="w-5 h-5 md:w-7 md:h-7" />
                        <h3 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter">Strategic Breakdown</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-6 md:gap-y-10 relative z-10">
                        <div className="space-y-2 md:space-y-3">
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Keyword Depth</p>
                          <p className="text-md md:text-lg text-zinc-400 font-bold uppercase tracking-tight leading-tight">{result.ats_evaluation.ats_breakdown.keywords}</p>
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Semantic Clarity</p>
                          <p className="text-md md:text-lg text-zinc-400 font-bold uppercase tracking-tight leading-tight">{result.ats_evaluation.ats_breakdown.readability}</p>
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Structure Integrity</p>
                          <p className="text-md md:text-lg text-zinc-400 font-bold uppercase tracking-tight leading-tight">{result.ats_evaluation.ats_breakdown.formatting}</p>
                        </div>
                        <div className="space-y-2 md:space-y-3">
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em]">Content Maturity</p>
                          <p className="text-md md:text-lg text-zinc-400 font-bold uppercase tracking-tight leading-tight">{result.ats_evaluation.ats_breakdown.content}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-[#0c0c0c] border-2 border-zinc-900 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] space-y-8 md:space-y-10 shadow-sm relative group overflow-hidden">
                       <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-700" />
                      <div className="flex items-center gap-4 text-primary border-b border-zinc-900 pb-4 md:pb-6 relative z-10">
                        <Brain className="w-5 h-5 md:w-7 md:h-7" />
                        <h3 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter">Neural Skills</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 relative z-10">
                        {result.resume_analysis.technical_skills.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary" className="bg-zinc-900 text-zinc-400 hover:bg-primary hover:text-black border-zinc-800 px-2 md:px-5 py-1 md:py-2.5 text-[7px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-inner">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0c0c0c] border-2 border-zinc-900 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] space-y-8 md:space-y-10 shadow-sm relative group overflow-hidden">
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-700" />
                      <div className="flex items-center gap-4 text-primary border-b border-zinc-900 pb-4 md:pb-6 relative z-10">
                        <Lightbulb className="w-5 h-5 md:w-7 md:h-7" />
                        <h3 className="text-lg md:text-3xl font-black text-white uppercase tracking-tighter">Growth Directives</h3>
                      </div>
                      <div className="space-y-4 md:space-y-6 relative z-10">
                        {result.resume_improvement_tips.slice(0, 4).map((tip: string, i: number) => (
                          <div key={i} className="flex gap-4 md:gap-5 items-start p-4 md:p-6 bg-black/50 rounded-[1.2rem] md:rounded-[1.5rem] border border-zinc-900 group/tip hover:border-primary/40 transition-all shadow-inner">
                            <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0 mt-0.5 group-hover/tip:scale-110 transition-transform" />
                            <p className="text-xs md:text-sm text-zinc-400 font-bold leading-relaxed tracking-tight uppercase">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12 pt-12">
                    <div className="flex items-center gap-3 md:gap-5 border-b-2 border-zinc-900 pb-8 md:pb-12">
                      <div className="p-4 md:p-6 bg-primary/10 rounded-[1.5rem] md:rounded-[2rem] border-2 border-primary/20 shadow-2xl">
                        <Code2 className="w-8 md:w-10 h-8 md:h-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter">Market Nodes</h3>
                        <p className="text-zinc-600 font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em] mt-1 md:mt-2">Live Verified Opportunities</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {result.internships && result.internships.length > 0 ? (
                        result.internships.map((job: any, i: number) => (
                          <div key={i} className="bg-[#0c0c0c] border-2 border-zinc-900 p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] group hover:border-primary/50 transition-all duration-700 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                            <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/5 blur-[80px] group-hover:bg-primary/10 transition-colors duration-700" />
                            <div className="space-y-6 md:space-y-8 relative z-10">
                              <div className="space-y-3">
                                <h4 className="text-xl md:text-3xl font-black text-white group-hover:text-primary transition-colors duration-500 uppercase tracking-tighter leading-none">{job.title}</h4>
                                <div className="flex items-center gap-2 text-zinc-600 font-black text-[8px] md:text-[10px] tracking-widest uppercase">
                                   <Briefcase className="w-3 h-3" /> {job.company} <span className="text-zinc-800 mx-1">•</span> <MapPin className="w-3 h-3" /> {job.location}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 py-3 md:py-4 border-y border-zinc-900/50">
                                {job.skills_required.map((s: string, j: number) => (
                                  <span key={j} className="text-[8px] md:text-[9px] font-black uppercase text-zinc-700 px-3 md:px-4 py-1 md:py-1.5 bg-black rounded-lg md:rounded-xl border border-zinc-900 group-hover:text-zinc-400 group-hover:border-primary/20 transition-all">{s}</span>
                                ))}
                              </div>
                            </div>
                            <Button variant="outline" className="w-full mt-8 md:mt-12 border-2 border-zinc-900 group-hover:border-primary/50 text-zinc-700 group-hover:text-white rounded-[1.5rem] md:rounded-[2rem] h-16 md:h-20 font-black uppercase tracking-widest text-[10px] shadow-inner transition-all hover:bg-primary/5" asChild>
                              <a href={job.apply_link} target="_blank" rel="noopener noreferrer">
                                Open Secure <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="md:col-span-2 py-20 px-4 md:p-32 text-center bg-zinc-900/10 rounded-[2.5rem] md:rounded-[3rem] border-2 md:border-4 border-dashed border-zinc-900 shadow-inner">
                          <p className="text-zinc-800 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-lg md:text-xl">Null Opportunities Detected</p>
                          <p className="text-zinc-900 font-black uppercase tracking-[0.2em] mt-4 text-[8px] md:text-base">Profile mismatch or extraction error in neural grid.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-24">
                    <Button variant="ghost" onClick={() => setStatus('idle')} className="text-zinc-800 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-all group">
                      <span className="group-hover:-translate-y-1 transition-transform">Initialize New Profile Scan</span>
                    </Button>
                  </div>
                </div>
              )}
            </FadeTransition>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
