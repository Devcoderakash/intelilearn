'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface ThoughtCardProps {
  thought: any;
  onEdit: (thought: any) => void;
  onDelete: (id: string) => void;
}

export function ThoughtCard({ thought, onEdit, onDelete }: ThoughtCardProps) {
  const date = thought.createdAt?.toDate ? thought.createdAt.toDate() : new Date();

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 bg-card overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl font-headline font-bold text-primary line-clamp-2 leading-tight">
            {thought.title}
          </CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onEdit(thought)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(thought.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(date, 'MMM d, yyyy')}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pb-4">
        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">
          {thought.content}
        </p>
      </CardContent>
      <CardFooter className="pt-0 flex flex-wrap gap-1.5">
        {thought.tagNames?.map((tag: string) => (
          <Badge 
            key={tag} 
            variant="secondary" 
            className="bg-primary/5 text-primary border-primary/10 font-medium px-2 py-0"
          >
            #{tag}
          </Badge>
        ))}
        {(!thought.tagNames || thought.tagNames.length === 0) && (
          <span className="text-[10px] italic text-muted-foreground">No tags</span>
        )}
      </CardFooter>
    </Card>
  );
}
