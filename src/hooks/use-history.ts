
import { supabase } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';

export type HistoryItem = {
  id: string;
  user_id: string;
  input_data: any;
  ai_output: any;
  readiness_score: number;
  module_type: string;
  created_at: string;
};

const CACHE_KEY = 'intellilearn_history_cache';

export function useHistory() {
  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync session manually since using lightweight fetch client
  const syncSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user ?? null;
    setUser(currentUser);
    return currentUser;
  }, []);

  useEffect(() => {
    syncSession();
    // Poll for session changes every 5 seconds as a fallback for missing event emitters
    const interval = setInterval(syncSession, 5000);
    return () => clearInterval(interval);
  }, [syncSession]);

  const fetchHistory = useCallback(async () => {
    const currentUser = await syncSession();
    if (!currentUser) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('user_id', currentUser.id);

      if (error) {
          const errorMsg = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
          throw new Error(errorMsg);
      }
      
      const results = data || [];
      setHistory(results);
      localStorage.setItem(`${CACHE_KEY}_${currentUser.id}`, JSON.stringify(results));
    } catch (err: any) {
      console.error("History Fetch Error Details:", err);
      const friendlyError = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(friendlyError);
      const cached = localStorage.getItem(`${CACHE_KEY}_${currentUser?.id}`);
      if (cached) setHistory(JSON.parse(cached));
    } finally {
      setIsLoading(false);
    }
  }, [syncSession]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveHistory = async (newItem: Omit<HistoryItem, 'id' | 'user_id' | 'created_at'>) => {
    const currentUser = await syncSession();
    if (!currentUser) return null;
    setIsSaving(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_history')
        .insert([{ ...newItem, user_id: currentUser.id }]);

      if (error) {
          // Flatten Supabase error objects for cleaner logging
          const errorMsg = typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error);
          throw new Error(errorMsg);
      }
      
      // Fetch latest history to sync UI
      await fetchHistory();
      return data;
    } catch (err: any) {
      console.error("History Save Error Details:", err);
      // Ensure the error state is a human-readable string
      const friendlyError = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError(friendlyError);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const clearHistory = async () => {
    const currentUser = await syncSession();
    if (!currentUser) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) throw error;
      setHistory([]);
      localStorage.removeItem(`${CACHE_KEY}_${currentUser.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to clear history.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    user,
    history,
    isLoading,
    saveHistory,
    clearHistory,
    isSaving,
    error,
    refresh: fetchHistory
  };
}
