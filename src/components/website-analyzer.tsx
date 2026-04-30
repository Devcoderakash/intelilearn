
'use client';

import { useState } from 'react';
import { Globe, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeTransition, SectionHeader } from './premium-ui';

export function WebsiteAnalyzer({ onAction }: { onAction: () => void }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing'>('idle');

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setStatus('analyzing');
    setTimeout(() => {
      setStatus('idle');
      onAction();
    }, 2000);
  };

  const WebsiteSkeleton = () => (
    <div className="space-y-10 animate-pulse w-full">
      <div className="bg-[#0c0c0c] border border-zinc-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
        <Skeleton className="h-12 w-1/3 bg-zinc-900" />
        <Skeleton className="h-24 w-full bg-zinc-900 rounded-2xl" />
        <div className="grid grid-cols-2 gap-6">
           <Skeleton className="h-40 bg-zinc-900 rounded-2xl" />
           <Skeleton className="h-40 bg-zinc-900 rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full bg-zinc-900 rounded-2xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pt-6">
      <SectionHeader 
        title="Website Semantic Analyzer" 
        subtitle="Enter a URL to decode institutional content, extract strategic nodes, and analyze SEO intelligence."
        icon={Globe}
        badge="Protocol: Domain Analysis"
      />

      <div className="flex gap-4 bg-[#0c0c0c] border border-zinc-800 p-3 rounded-[1.5rem] shadow-inner">
        <Input 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ENTER DOMAIN PROTOCOL (E.G. EXAMPLE.COM)..."
          className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white px-6 h-16 text-xl font-black uppercase tracking-tight placeholder:text-zinc-800"
        />
        <Button onClick={handleAnalyze} disabled={status === 'analyzing' || !url.trim()} className="px-12 h-16 font-black rounded-xl shadow-2xl shadow-primary/20 text-lg uppercase tracking-tight">
          {status === 'analyzing' ? 'Decoding...' : <><Search className="w-6 h-6 mr-2" /> Start Extraction</>}
        </Button>
      </div>

      <FadeTransition viewKey={status} className="mt-8 flex flex-col items-center">
        {status === 'analyzing' ? (
          <WebsiteSkeleton />
        ) : (
          <div className="border border-zinc-800 rounded-[2.5rem] bg-zinc-900/30 flex flex-col items-center justify-center p-20 text-center h-[400px] shadow-2xl border-dashed w-full">
            <Globe className="w-16 h-16 text-zinc-800 mb-8" />
            <p className="text-white font-black text-2xl uppercase tracking-tighter">Null Domain Stream</p>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Inject a URL to initialize neural extraction sequence.</p>
          </div>
        )}
      </FadeTransition>
    </div>
  );
}
