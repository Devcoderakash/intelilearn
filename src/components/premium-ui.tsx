'use client';

import React from 'react';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FadeTransition = ({ children, viewKey, className = "" }: { children: React.ReactNode, viewKey: string, className?: string }) => (
  <div 
    key={viewKey} 
    className={cn("premium-animate", className)}
  >
    {children}
  </div>
);

export const PremiumSpinner = ({ text }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center space-y-6">
    <div className="relative flex items-center justify-center w-12 h-12">
      <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
      <div className="absolute inset-2 rounded-full border-t-2 border-primary/30 animate-spin [animation-duration:2s]" />
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
    </div>
    {text && <p className="text-zinc-500 font-medium text-sm animate-pulse">{text}</p>}
  </div>
);

export const ToastError = ({ message }: { message: string }) => (
  <div className="fixed bottom-6 right-6 z-[100] bg-zinc-950 border border-zinc-800 text-zinc-200 px-6 py-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-right-5 shadow-2xl">
    <div className="bg-red-500/10 p-2 rounded-full">
      <AlertCircle className="w-5 h-5 text-red-500" />
    </div>
    <span className="text-sm font-semibold">{message}</span>
  </div>
);

export const SectionHeader = ({ title, subtitle, icon: Icon, onBack }: { title: string, subtitle: string, icon: any, onBack?: () => void }) => {
  return (
    <header className="flex flex-col mb-8 md:mb-12">
      {onBack && (
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4 md:mb-6 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
        </button>
      )}
      <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
        <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl">
          <Icon className="w-5 md:w-6 h-5 md:h-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">{title}</h1>
      </div>
      <p className="text-zinc-600 md:text-zinc-500 max-w-2xl text-xs md:text-lg font-bold md:font-medium leading-relaxed uppercase md:normal-case tracking-tight md:tracking-normal">{subtitle}</p>
    </header>
  );
};
