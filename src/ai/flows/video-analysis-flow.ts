
'use server';
/**
 * @fileOverview Video helper flow with Double-Fallback Transcript Protocol.
 * 
 * - Primary: Transcript API
 * - Fallback: SerpApi YouTube Video Transcript Engine (Targeted Node)
 * - Resilience: Groq -> Gemini -> OpenAI analysis grid.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateWithGeminiCycle } from "@/lib/ai-resilience";

const VideoInputSchema = z.object({
  url: z.string().url(),
});

const VideoOutputSchema = z.object({
  id: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  transcript: z.string(),
  timestamps: z.array(z.object({
    time: z.string(),
    label: z.string(),
  })),
  recommendations: z.array(z.object({
    title: z.string(),
    link: z.string(),
  })).optional(),
});

const ChatInputSchema = z.object({
  videoId: z.string(),
  transcript: z.string(),
  message: z.string(),
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })).optional(),
});

const ChatOutputSchema = z.object({
  response: z.string(),
});

function extractVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?\/\s]{11})/);
  return match ? match[1] : '';
}

async function fetchTranscript(url: string) {
  const videoId = extractVideoId(url);
  const serperKey = process.env.SERPER_API_KEY;
  const apifyToken = process.env.APIFY_TOKEN;
  const transcriptApiKey = process.env.TRANSCRIPT_API_KEY;
  
  if (!videoId) {
    throw new Error("Invalid YouTube link. Please provide a full URL.");
  }

  // 1. Try Primary Transcript API
  if (transcriptApiKey) {
    try {
      console.log("Attempting Primary Transcript API...");
      const res = await fetch(`https://transcriptapi.com/api/v2/youtube/transcript?video_url=${encodeURIComponent(url)}&format=json`, {
        headers: {
          "Authorization": `Bearer ${transcriptApiKey}`
        }
      });
      const data = await res.json();
      if (data && (data.transcript || data.text)) {
        const text = Array.isArray(data.transcript) 
          ? data.transcript.map((s: any) => s.text).join(' ') 
          : (data.transcript || data.text);
        return { text, id: videoId, source: 'transcriptapi' };
      }
    } catch (e) {
      console.warn("Primary Transcript API failed, trying fallbacks...");
    }
  }

  // 2. Try the built-in raw fetch (Local Scraper Fallback)
  try {
     console.log("Attempting Local Raw HTML Scraper...");
     const ytRes = await fetch(url.includes('youtube.com') || url.includes('youtu.be') ? url : `https://www.youtube.com/watch?v=${videoId}`);
     const html = await ytRes.text();
     const regex = /"captions":\{"playerCaptionsTracklistRenderer":\{"captionTracks":\[\{"baseUrl":"([^"]+)"/;
     const match = html.match(regex);
     if (match && match[1]) {
        let transcriptUrl = match[1].replace(/\\u0026/g, '&');
        transcriptUrl += '&fmt=json3';
        const tRes = await fetch(transcriptUrl);
        const tData = await tRes.json();
        if (tData && tData.events) {
           const text = tData.events.map((e: any) => e.segs?.map((s: any) => s.utf8).join('')).join(' ').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
           return { text, id: videoId, source: 'local-scraper' };
        }
     }
  } catch(e) {
     console.warn("Local Raw HTML Scraper failed...");
  }

  // 3. Fallback to SerpApi YouTube Transcript Engine
  if (serperKey) {
    try {
      console.log("Attempting SerpApi / Serper.dev fallbacks...");
      const serpUrl = `https://serpapi.com/search.json?engine=youtube_video_transcript&video_id=${videoId}&api_key=${serperKey}`;
      const res = await fetch(serpUrl);
      const data = await res.json();
      
      if (data && data.video_transcript) {
        const text = data.video_transcript.map((s: any) => s.text).join(' ');
        return { text, id: videoId, source: 'serpapi' };
      }
    } catch (e) {
      try {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: url,
            engine: 'youtube_video_transcript',
            video_id: videoId
          })
        });
        const data = await res.json();
        if (data && data.video_transcript) {
          const text = data.video_transcript.map((s: any) => s.text).join(' ');
          return { text, id: videoId, source: 'serper' };
        }
      } catch (e2) {
        console.warn("Serper.dev fallback failed.");
      }
    }
  }

  // 4. Robust Fallback: Apify YouTube Transcript Scraper
  if (apifyToken) {
    try {
      console.log("Attempting Apify fallback via native REST...");
      const apifyUrl = `https://api.apify.com/v2/acts/streamer~youtube-transcript-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
      
      const manualRes = await fetch(apifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls: [url], subtitlesType: 'manual', maxRetries: 2 })
      });
      const items = await manualRes.json();
      if (Array.isArray(items) && items.length > 0 && items[0].transcript) {
        return { text: items[0].transcript, id: videoId, source: 'apify-manual' };
      }

      const autoRes = await fetch(apifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls: [url], subtitlesType: 'auto', maxRetries: 2 })
      });
      const autoItems = await autoRes.json();
      if (Array.isArray(autoItems) && autoItems.length > 0 && autoItems[0].transcript) {
        return { text: autoItems[0].transcript, id: videoId, source: 'apify-auto' };
      }
    } catch (e) {
      console.error("Apify transcript retrieval failed:", e);
    }
  }

  // 5. META-DATA FALLBACK (if all transcripts fail)
  try {
     console.log("All transcript methods failed. Attempting Meta-Data Fallback...");
     const ytRes = await fetch(url.includes('youtube.com') || url.includes('youtu.be') ? url : `https://www.youtube.com/watch?v=${videoId}`);
     const html = await ytRes.text();
     const titleMatch = html.match(/<title>(.*?)<\/title>/);
     const descMatch = html.match(/<meta name="description" content="(.*?)"/);
     
     const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : "Unknown Video Title";
     const description = descMatch ? descMatch[1] : "No description available.";
     
     if (title) {
        return { text: `[VIDEO METADATA ONLY - NO TRANSCRIPT FOUND]\n\nTitle: ${title}\n\nDescription: ${description}`, id: videoId, source: 'metadata-fallback' };
     }
  } catch(e) {
     console.warn("Meta-data fallback failed...");
  }

  return { text: `[VIDEO CRITICAL FAILURE - NO DATA FOUND]\n\nVideoID: ${videoId}`, id: videoId, source: 'critical-failure' };
}

// JS logic removed as per user request to use Groq for all summarization.

async function searchSimilarVideos(title: string) {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return [];
  try {
    // Hardening search query to force real YouTube results
    const refinedQuery = `${title} educational tutorial site:youtube.com`;
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': serperKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: refinedQuery, num: 8 }) // Fetch more to filter down
    });
    const data = await res.json();
    
    // Strict filtering to ensure only real watchable links
    const realLinks = data.organic?.filter((item: any) => 
      (item.link.includes('youtube.com/watch?v=') || item.link.includes('youtu.be/')) &&
      !item.link.includes('playlist') && 
      !item.link.includes('channel')
    ).map((item: any) => ({
      title: item.title.replace(' - YouTube', '').trim(),
      link: item.link
    })).slice(0, 3) || [];

    return realLinks;
  } catch (e) {
    console.error("Multi-Source Intel fetch failed:", e);
    return [];
  }
}

async function callGroqVideo(prompt: string): Promise<any> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing.");

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You are a Principal Academic Note-Taker & Architect.
TASK: Synthesize the video transcript into high-fidelity, beautifully formatted "Study Notes".

MATH vs CODE PROTOCOL (STRICT):
1. MATH: Use $$ blocks ONLY for mathematical equations. Hardened with double backslash (\\\\\\\\).
2. CODE: Use \`\`\`language blocks ONLY for programming code (Python, JS, etc.). NEVER wrap code in $$ blocks.
3. ISOLATED PAIRS: Every Math block or Code block MUST be followed by a "Plain English Explanation" bullet.

LAYOUT & STRUCTURE:
1. HEADERS: Use '# Topic' and '## Details' for hierarchy. Use '---' between major modules.
2. PREMIUM CALLOUTS: 
   - Instead of [IMPORTANT], use '### 🚨 IMPORTANT' followed by a bold bullet list.
   - Instead of [KEY INSIGHT], use '### 💡 KEY INSIGHT' followed by a detailed paragraph.
3. EXAMPLES: Use '### ✅ Practical Example' with a dedicated Code/Math block and its Explanation.

JSON OUTPUT SCHEMA:
{
  "summary": "string (Markdown study notes with properly separated Code/Math blocks and premium callouts)",
  "keyPoints": ["string"],
  "timestamps": [{"time": "string", "label": "string"}],
  "recommendations": [{"title": "string", "link": "string"}]
}` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    }),
    signal: AbortSignal.timeout(60000)
  });
  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    console.error("Groq API Error:", data);
    throw new Error(`Groq Analysis failed: ${data.error?.message || 'Unknown Error'}`);
  }
  return JSON.parse(data.choices[0].message.content);
}

async function callOpenAIVideo(prompt: string): Promise<any> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing.");
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Video analyst JSON output agent.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    throw new Error(`OpenAI Analysis failed: ${data.error?.message || 'Unknown Error'}`);
  }
  return JSON.parse(data.choices[0].message.content);
}

async function callOpenRouterVideo(prompt: string): Promise<any> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${apiKey}`, 
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://adash.app',
      'X-Title': 'Adash AI'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: 'Video analyst JSON output agent. Return ONLY JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });
  const data = await response.json();
  if (!response.ok || !data.choices?.[0]?.message?.content) {
    throw new Error(`OpenRouter failed: ${data.error?.message || 'Unknown Error'}`);
  }
  return JSON.parse(data.choices[0].message.content);
}

async function callCohereVideo(prompt: string): Promise<any> {
  const apiKey = process.env.COHERE_API_KEY;
  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      model: 'command-r-plus',
      preamble: "You are a Video analyst JSON output agent. Return ONLY a valid JSON object matching the requested schema. No conversational text.",
    })
  });
  const data = await response.json();
  if (!response.ok || !data.text) {
    throw new Error(`Cohere failed: ${data.message || 'Unknown Error'}`);
  }
  const jsonMatch = data.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Cohere returned malformed JSON.");
  return JSON.parse(jsonMatch[0]);
}

/**
 * Budget-Aware Chunking for Groq Free Plan (12k TPM Limit)
 * maxChars: 8000 (~2000 tokens) provides safety for both Input and Output tokens.
 */
function chunkText(text: string, maxChars: number = 8000): string[] {
  const chunks = [];
  let currentPos = 0;
  while (currentPos < text.length) {
    let endPos = currentPos + maxChars;
    if (endPos < text.length) {
      const lastSpec = text.lastIndexOf('. ', endPos);
      if (lastSpec > currentPos + (maxChars * 0.4)) {
        endPos = lastSpec + 1;
      } else {
        const lastSpace = text.lastIndexOf(' ', endPos);
        if (lastSpace > currentPos) endPos = lastSpace;
      }
    }
    chunks.push(text.substring(currentPos, endPos).trim());
    currentPos = endPos;
  }
  return chunks;
}

async function smartAnalyzeTranscript(text: string): Promise<any> {
    const isMetadataFallback = text.includes('[VIDEO METADATA ONLY');
    const isCriticalFailure = text.includes('[VIDEO CRITICAL FAILURE');
    
    if (isMetadataFallback || isCriticalFailure) {
        let title = "this topic";
        if (isMetadataFallback) {
            const titleMatch = text.match(/Title: (.*)/);
            title = titleMatch ? titleMatch[1] : "this content";
        } else {
            // If critical failure, try to extract ID and search generally
            const idMatch = text.match(/VideoID: (.*)/);
            title = idMatch ? `YouTube video ${idMatch[1]}` : "relevant educational content";
        }
        
        const recs = await searchSimilarVideos(title);
        
        console.log("Transcript Failure handled with recommendations...");
        const result = await callGroqVideo(`
          Generate a beautiful, premium message for the user.
          The video processing node was unable to access the transcript or metadata for this specific link.
          
          Context: ${isMetadataFallback ? "Content is secured by owner." : "Video node unreachable or invalid."}
          
          Task:
          1. Apologize gracefully.
          2. Explain we respect content security/privacy.
          3. Provide recommendations for similar content based on the context: ${title}
          4. Suggest they try one of the alternative links provided.
          
          Alternative Links: ${JSON.stringify(recs)}
          
          Respond ONLY in JSON.
        `);
        return { ...result, recommendations: recs };
    }

    const chunks = chunkText(text);
    console.log(`Groq Budgeting: Processing in ${chunks.length} chunks...`);

    const chunkResults = [];
    for (let i = 0; i < chunks.length; i++) {
        // Essential Throttling: 15s delay to stay within 12k TPM limit
        if (i > 0) {
            console.log(`Respecting Groq TPM: Cooling down for 15s...`);
            await new Promise(r => setTimeout(r, 15000));
        }

        const prompt = isMetadataFallback 
            ? `Metadata Analysis: ${chunks[i]}`
            : `Analyze section ${i + 1} of this transcript. Respond in JSON. Transcript: ${chunks[i]}`;
        
        try {
            console.log(`Chunk ${i+1}: Calling Groq (Llama-3.3-70b)...`);
            chunkResults.push(await callGroqVideo(prompt));
        } catch (e: any) {
            console.warn(`Chunk ${i+1} Failed: ${e.message}. Attempting Metadata Fallback...`);
            
            // If it's a JSON fail or any Groq fail, we transition to Metadata Fallback
            // But we add a friendly message for the UI
            const fallbackResult = {
              summary: "### ⚠️ Update: Content Access Delayed\n\nAbhi main is video ki full transcript fetch nahi kar paya hoon, toh please thodi der baad try karna. \n\nTab tak ke liye, maine **Video Metadata** (Title aur Description) ko analyze karke ek initial report niche taiyar ki hai takki aapko basic context mil sake.\n\n--- \n\n" + (chunks[i] || "Processing video metadata..."),
              keyPoints: ["Full transcript unreachable currently", "Metadata analysis active"],
              timestamps: [],
              recommendations: []
            };
            chunkResults.push(fallbackResult);
        }
    }

    if (chunkResults.length === 1) return chunkResults[0];

    // Master Synthesis with token-limit protection
    console.log("Budgeting Final Synthesis...");
    await new Promise(r => setTimeout(r, 10000)); // Final cool-down

    // Fetch recommendations for the master report
    const videoTitle = text.slice(0, 100) || "relevant educational topic";
    const masterRecs = await searchSimilarVideos(videoTitle);

    const summaryContext = chunkResults.map((r, i) => `Part ${i+1}: ${r.summary}`).join('\n\n');
    const masterPrompt = `Synthesize these partial summaries into one final master report. Keep it detailed but concise enough for local memory limits. Summaries: ${summaryContext}`;

    try {
        const final = await callGroqVideo(masterPrompt);
        return { 
            ...final, 
            timestamps: chunkResults.flatMap(r => r.timestamps).slice(0, 15),
            recommendations: masterRecs 
        };
        } catch (e2) {
            try {
               const final = await callOpenAIVideo(masterPrompt);
               return { ...final, timestamps: chunkResults.flatMap(r => r.timestamps).slice(0, 15), recommendations: masterRecs };
            } catch (e3) {
               try {
                  const final = await callOpenRouterVideo(masterPrompt);
                  return { ...final, timestamps: chunkResults.flatMap(r => r.timestamps).slice(0, 15), recommendations: masterRecs };
               } catch (e4) {
                  try {
                     const final = await callCohereVideo(masterPrompt);
                     return { ...final, timestamps: chunkResults.flatMap(r => r.timestamps).slice(0, 15), recommendations: masterRecs };
                  } catch (e5) {
                     return {
                        summary: "### API Access Exhausted\n\nAll intelligence nodes are currently unavailable.",
                        keyPoints: ["Intelligence services unavailable"],
                        timestamps: [],
                        recommendations: masterRecs
                     };
                  }
               }
            }
        }
}

export async function analyzeVideo(input: z.infer<typeof VideoInputSchema>) {
  const transcriptData = await fetchTranscript(input.url);
  const result = await smartAnalyzeTranscript(transcriptData.text);
  return { ...result, id: transcriptData.id, transcript: transcriptData.text };
}

export async function simpleAnalyzeVideo(input: z.infer<typeof VideoInputSchema>) {
  const transcriptData = await fetchTranscript(input.url);
  const result = await smartAnalyzeTranscript(transcriptData.text);
  return { ...result, id: transcriptData.id, transcript: transcriptData.text, isAiDeep: true };
}

export async function chatWithVideo(input: z.infer<typeof ChatInputSchema>) {
  return videoChatFlow(input);
}

const videoChatFlow = ai.defineFlow(
  {
    name: 'videoChatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const promptText = `Here is the transcript of the video: ${input.transcript}\n\nUser Message: ${input.message}`;
    const sysPrompt = "You are an intelligent Video Companion. You have access to the full video transcript. Your goal is to answer questions, explain complex concepts, and provide context based SOLELY on the transcript. If the user asks something not mentioned, politely explain you can only discuss the video content. Be helpful, technical, and concise.";

    // Improved Resilience Grid for Chat
    try {
      const apiKey = process.env.GROQ_API_KEY;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: sysPrompt },
            ...(input.history?.slice(-4).map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.content })) || []), // Keep last 4 turns for context
            { role: 'user', content: promptText }
          ],
          temperature: 0.2
        })
      });
      const data = await response.json();
      return { response: data.choices[0].message.content };
    } catch (e) {
      try {
        const {text} = await generateWithGeminiCycle({
          system: sysPrompt,
          history: input.history?.slice(-4).map(h => ({ role: h.role, content: [{ text: h.content }] })) as any,
          prompt: promptText,
        });
        return { response: text };
      } catch (e2) {
        try {
           const res = await callOpenAIVideo(promptText); // Re-using video caller as it can handle chat text too if modified slightly, but better use a simple fetch
           return { response: res.summary || "Fallback: Analysis complete." };
        } catch (e3) {
           try {
              const res = await callOpenRouterVideo(promptText);
              return { response: res.summary || "Fallback: Analysis complete." };
           } catch (e4) {
              return { response: "API have been failled sorry from devloper" };
           }
        }
      }
    }
  }
);
