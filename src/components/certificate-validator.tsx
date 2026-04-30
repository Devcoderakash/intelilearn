'use client';

import { useState } from 'react';
import { ShieldCheck, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PremiumSpinner, FadeTransition, SectionHeader, ToastError } from './premium-ui';

export function CertificateValidator({ onAction }: { onAction: () => void }) {
  const [status, setStatus] = useState<'idle' | 'authenticating'>('idle');
  const [file, setFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = () => {
    setFile("SCREENSHOT_2026_04_11_CERT.PNG");
    setError(null);
  };

  const handleValidate = () => {
    if (!file) return;
    setStatus('authenticating');
    setTimeout(() => {
      setStatus('idle');
      setError("ANALYSIS FAILED: TAMPER DETECTED IN DATA STREAM.");
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto pt-6 relative">
      {error && <ToastError message={error} />}
      
      <SectionHeader 
        title="Certificate Verifications Node" 
        subtitle="AI-powered validation against neural tampering and unofficial databases using proprietary OCR arrays."
        icon={ShieldCheck}
        badge="Protocol: Cryptographic Check"
      />

      <div className="bg-[#0c0c0c] border border-zinc-800/50 p-10 rounded-[2.5rem] shadow-2xl space-y-10">
        <FadeTransition viewKey={file ? 'file' : 'upload'} className="w-full">
          {file ? (
            <div className="border-4 border-dashed border-primary/20 bg-primary/5 rounded-[2rem] p-20 text-center flex flex-col items-center justify-center space-y-6">
               <div className="p-6 bg-primary/10 rounded-2xl mb-4 shadow-inner ring-1 ring-primary/20">
                 <UploadCloud className="w-12 h-12 text-primary" />
               </div>
               <p className="font-black text-3xl text-white uppercase tracking-tighter">{file}</p>
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Neural Packet Ready for Extraction</p>
               <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-zinc-600 hover:text-white mt-6 font-black uppercase text-[10px] tracking-widest transition-all">Reset Sequence</Button>
            </div>
          ) : (
            <div 
              className="border-4 border-dashed border-zinc-800/50 hover:border-primary/30 bg-black/40 rounded-[2.5rem] p-20 text-center cursor-pointer transition-all group flex flex-col items-center justify-center h-80 shadow-inner"
              onClick={handleUpload}
            >
              <div className="p-8 bg-zinc-900 rounded-[2rem] mb-6 group-hover:bg-primary/10 group-hover:scale-110 transition-all shadow-inner ring-1 ring-zinc-800 group-hover:ring-primary/20">
                <UploadCloud className="w-16 h-16 text-zinc-700 group-hover:text-primary transition-colors" />
              </div>
              <p className="font-black text-zinc-500 text-2xl uppercase tracking-tighter group-hover:text-white transition-colors">Inject Academic Protocol</p>
              <p className="text-[10px] font-black text-zinc-700 mt-3 uppercase tracking-[0.2em]">Supports RAW, JPEG, and Neural PDF arrays</p>
            </div>
          )}
        </FadeTransition>
        
        <Button 
          className="w-full py-10 rounded-[2rem] text-2xl font-black shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] uppercase tracking-tight" 
          onClick={handleValidate} 
          disabled={!file || status === 'authenticating'}
        >
          {status === 'authenticating' ? (
            <PremiumSpinner text="Executing OCR Neural Tamper Check..." />
          ) : (
            <span className="flex items-center gap-4"><CheckCircle2 className="w-8 h-8" /> Validate Protocol Authenticity</span>
          )}
        </Button>
      </div>
    </div>
  );
}
