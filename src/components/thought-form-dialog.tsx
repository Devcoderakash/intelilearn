'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, Loader2, Plus, Info } from "lucide-react";
import { expandExistingThought } from "@/ai/flows/expand-existing-thought";
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface ThoughtFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
}

export function ThoughtFormDialog({ isOpen, onClose, initialData }: ThoughtFormDialogProps) {
  const { user } = useUser();
  const { firestore } = useFirestore() || {};
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [perspectives, setPerspectives] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setTags(initialData.tagNames || []);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setPerspectives([]);
    }
  }, [initialData, isOpen]);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleExpandContent = async () => {
    if (!content.trim()) return;
    
    setIsExpanding(true);
    try {
      const result = await expandExistingThought({
        thoughtContent: content,
        expansionGoal: "enrich the existing thought with more depth and perspective"
      });
      setContent(result.expandedThought);
      setPerspectives(result.newPerspectives);
      toast({
        title: "Thought Expanded",
        description: "AI has deepened your idea and suggested new perspectives.",
      });
    } catch (error) {
      console.error("Expansion failed", error);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleAddPerspective = (p: string) => {
    setContent(prev => prev + "\n\n" + p);
    setPerspectives(prev => prev.filter(item => item !== p));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !user || !firestore) return;
    
    const thoughtData = {
      title: title.trim(),
      content: content.trim(),
      tagNames: tags,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    };

    if (initialData?.id) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'thoughts', initialData.id), thoughtData);
    } else {
      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'thoughts'), {
        ...thoughtData,
        createdAt: serverTimestamp(),
      });
    }

    toast({
      title: initialData ? "Thought Refined" : "New Thought Planted",
      description: "Your inspiration has been securely stored in the cloud.",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] border-primary/20 bg-background shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl text-primary">
            {initialData ? 'Refine Your Thought' : 'Plant a New Thought'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {initialData ? 'Update and polish your existing idea.' : 'Capture your flash of inspiration before it fades.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your thought a name..."
              className="border-primary/10 focus:border-primary focus:ring-primary/20 bg-white"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content" className="text-sm font-semibold">The Core Idea</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={handleExpandContent}
                disabled={isExpanding || !content.trim()}
                className="h-7 text-accent hover:text-accent hover:bg-accent/10 transition-colors gap-1.5"
              >
                {isExpanding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                <span className="text-xs">AI Expand & Enrich</span>
              </Button>
            </div>
            <Textarea 
              id="content" 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your thought in detail..."
              className="min-h-[200px] border-primary/10 focus:border-primary focus:ring-primary/20 bg-white resize-none"
              required
            />
          </div>

          {perspectives.length > 0 && (
            <div className="space-y-2 p-4 bg-accent/5 border border-accent/20 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase mb-2">
                <Info className="h-3.5 w-3.5" /> AI Perspectives
              </div>
              <div className="flex flex-wrap gap-2">
                {perspectives.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAddPerspective(p)}
                    className="text-left text-xs bg-white hover:bg-accent/10 border border-accent/10 p-2 rounded-lg transition-colors group relative pr-8"
                  >
                    <span className="line-clamp-2">{p}</span>
                    <Plus className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Tags</Label>
            <div className="flex gap-2">
              <Input 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags (e.g. project, research)..."
                className="border-primary/10 focus:border-primary focus:ring-primary/20 bg-white"
              />
              <Button type="button" variant="secondary" onClick={handleAddTag} className="shrink-0">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} className="bg-primary/10 text-primary border-primary/10 hover:bg-primary/20 cursor-default">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-primary/5">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {initialData ? 'Save Changes' : 'Bloom Thought'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
