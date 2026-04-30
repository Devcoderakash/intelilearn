'use client';

import { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PremiumSpinner, FadeTransition } from './premium-ui';

export function SimpleToolPlaceholder({ title, icon: Icon, onAction }: { title: string, icon: any, onAction: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onAction();
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto space-y-10 py-10">
      <div className="text-center space-y-4">
        <div className="p-6 bg-primary/10 rounded-full w-max mx-auto shadow-inner ring-4 ring-primary/5">
          <Icon className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight text-white">{title}</h1>
        <p className="text-zinc-400 text-xl max-w-lg">Advanced algorithmic processing for institutional-grade {title.toLowerCase()}.</p>
      </div>

      <Card className="w-full bg-zinc-900/50 backdrop-blur border-zinc-800 shadow-2xl rounded-3xl p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-primary" />
            Active Module Interface
          </CardTitle>
          <CardDescription className="text-zinc-500">Configure parameters for the AI processing engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FadeTransition viewKey={loading ? 'loading' : 'idle'}>
            {loading ? (
              <div className="h-40 flex items-center justify-center">
                <PremiumSpinner text="Executing AI Sequence..." />
              </div>
            ) : (
              <div className="h-40 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-3">
                 <Send className="w-8 h-8 opacity-20" />
                 <p className="font-medium">Module Input Interface Ready</p>
              </div>
            )}
          </FadeTransition>
          <Button size="lg" className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20" onClick={handleAction} disabled={loading}>
            {!loading && <Sparkles className="w-5 h-5 mr-2" />}
            {loading ? 'Processing...' : 'Execute AI Sequence'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}