'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, ArrowRight, Lightbulb, Leaf } from "lucide-react";
import { generateCreativePrompts } from "@/ai/flows/generate-creative-prompts-flow";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export function AiIdeationPanel() {
  const { user } = useUser();
  const { firestore } = useFirestore() || {};
  const { toast } = useToast();

  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!keywords.trim()) return;
    
    setIsGenerating(true);
    try {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      const result = await generateCreativePrompts({ keywords: keywordList });
      setPrompts(result.creativePrompts);
    } catch (error) {
      console.error("Prompts generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlantPrompt = (prompt: string) => {
    if (!user || !firestore) return;

    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'thoughts'), {
      title: "AI Spark",
      content: prompt,
      tagNames: ['ai-spark', ...keywords.split(',').map(k => k.trim())],
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast({
      title: "Spark Planted",
      description: "This prompt has been added as a new thought in your garden.",
    });
  };

  return (
    <Card className="border-accent/20 bg-accent/5 overflow-hidden border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg font-headline text-accent">AI Ideation Bloom</CardTitle>
            <CardDescription className="text-xs">Enter keywords to generate creative sparks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g. nature, space, time..."
            className="bg-white border-accent/20 focus:border-accent focus:ring-accent/20"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !keywords.trim()}
            className="bg-accent hover:bg-accent/90 shrink-0"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        {prompts.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
            {prompts.map((prompt, i) => (
              <div 
                key={i} 
                className="flex gap-3 p-3 bg-white rounded-md border border-accent/10 shadow-sm text-sm text-muted-foreground group hover:border-accent/30 transition-colors relative pr-10"
              >
                <Lightbulb className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p className="leading-tight">{prompt}</p>
                <button
                  onClick={() => handlePlantPrompt(prompt)}
                  className="absolute right-2 top-2 p-1 text-primary hover:bg-primary/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Plant as new thought"
                >
                  <Leaf className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
