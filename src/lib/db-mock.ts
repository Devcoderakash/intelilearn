'use client';

export interface Thought {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'thoughtbloom_thoughts';

export const getThoughts = (): Thought[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  return JSON.parse(stored);
};

export const saveThought = (thought: Omit<Thought, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
  const thoughts = getThoughts();
  const now = Date.now();
  
  if (thought.id) {
    const index = thoughts.findIndex(t => t.id === thought.id);
    if (index !== -1) {
      thoughts[index] = {
        ...thoughts[index],
        ...thought,
        updatedAt: now,
      } as Thought;
    }
  } else {
    const newThought: Thought = {
      ...thought,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    } as Thought;
    thoughts.unshift(newThought);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  return thoughts;
};

export const deleteThought = (id: string) => {
  const thoughts = getThoughts();
  const filtered = thoughts.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};