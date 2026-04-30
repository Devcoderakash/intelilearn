
import { supabase } from './supabase';

/**
 * Intelligence Service
 * Handles Knowledge Graph, RAG (Vector Search), and Evaluations.
 */
export const IntelligenceService = {
  
  // 1. Lightweight Knowledge Graph Layer (Concepts & Relationships)
  async getKnowledgeContext(topic: string) {
    // Modular logic for backend context enhancement
    const graphBase = {
      "React": ["Hooks", "Components", "State Management"],
      "Node.js": ["Express", "Event Loop", "Streams"],
      "AI": ["LLMs", "Embeddings", "FastAPI"]
    };
    
    // Simplistic dependency mapping for tutoring
    const dependencies = graphBase[topic as keyof typeof graphBase] || [];
    return {
      topic,
      relatedConcepts: dependencies,
      depth: dependencies.length > 0 ? "Conceptual" : "Foundational"
    };
  },

  // 2. Vector Search (Notes Retrieval)
  async retrieveRelevantNotes(queryVector: number[]) {
    try {
      const { data, error } = await supabase.rpc('match_notes', {
        query_embedding: queryVector,
        match_threshold: 0.7,
        match_count: 5
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Vector Search Error:", err);
      return [];
    }
  },

  // 3. Assignment Evaluation Storage
  async saveEvaluation(userId: string, evalData: { title: string, content: string, score: number, feedback: any }) {
    return await supabase
      .from('assignment_evaluations')
      .insert([{
        user_id: userId,
        assignment_title: evalData.title,
        content: evalData.content,
        score: evalData.score,
        feedback: evalData.feedback
      }]);
  }
};
