
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const COHERE_API_KEY = process.env.COHERE_API_KEY;

export async function POST(req: Request) {
  try {
    const { content, title, metadata, userId } = await req.json();

    if (!content || !userId) {
      return NextResponse.json({ error: 'Content and UserId are required' }, { status: 400 });
    }

    // 1. Chunking Strategy (Max 1200 chars per segment)
    const chunkSize = 1200;
    const allChunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      allChunks.push(content.slice(i, i + chunkSize));
    }

    // Cohere Batching Limit = 96 texts per call
    const batchSize = 96;
    const chunkBatches = [];
    for (let i = 0; i < allChunks.length; i += batchSize) {
      chunkBatches.push(allChunks.slice(i, i + batchSize));
    }

    let allEmbeddings: number[][] = [];
    let processedChunks: string[] = [];

    for (const batch of chunkBatches) {
      let batchEmbeddings: number[][] | null = null;

      // Fallback 1: Cohere v2 (Batch Mode - High Efficiency)
      try {
        const cohereRes = await fetch('https://api.cohere.com/v2/embed', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${COHERE_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            model: 'embed-v4.0', 
            input_type: 'search_document',
            texts: batch,
            output_dimension: 1024 // Reverted to 1024 to match your updated database
          })
        });

        if (cohereRes.ok) {
          const cData = await cohereRes.json();
          batchEmbeddings = cData.embeddings.float;
        }
      } catch (e) { console.error("Cohere Batch Fail:", e); }

      // Fallback 2: Individual Processing (Gemini/OpenAI) if Batch fails
      if (!batchEmbeddings) {
        for (const chunk of batch) {
          let singleEmbed: number[] | null = null;
          
          // Gemini Fallback
          try {
            const gUrl = `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`;
            const gRes = await fetch(gUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: { parts: [{ text: chunk }] } })
            });
            if (gRes.ok) {
              const gData = await gRes.json();
              singleEmbed = gData.embedding.values;
            }
          } catch (e) {}

          // OpenAI Fallback (Using Native Fetch to remove dependency)
          if (!singleEmbed) {
            try {
              const oRes = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ model: 'text-embedding-3-small', input: chunk })
              });
              if (oRes.ok) {
                const oData = await oRes.json();
                singleEmbed = oData.data[0].embedding;
              }
            } catch (e) {}
          }

          if (singleEmbed) {
            allEmbeddings.push(singleEmbed);
            processedChunks.push(chunk);
          }
        }
      } else {
        allEmbeddings.push(...batchEmbeddings);
        processedChunks.push(...batch);
      }
    }

    // 2. Optimized Supabase Batch Insert
    if (processedChunks.length > 0) {
      const dbEntries = processedChunks.map((chunk, idx) => ({
        user_id: userId,
        content: chunk,
        title: title || 'Untitled Note',
        metadata: { ...metadata, is_chunk: true, batch_index: idx },
        embedding: allEmbeddings[idx]
      }));

      const { data, error } = await supabase.from('study_notes').insert(dbEntries);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, count: processedChunks.length });
  } catch (err: any) {
    console.error('Master Batch Logic Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
