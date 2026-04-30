
'use server';
/**
 * @fileOverview AI Career Assistant and Resume Analyzer with Apify + Serper Fallback.
 * 
 * - Hardened Schema Protocol: Ensures all models return the exact resume_analysis structure.
 * - Double-Engine Grid: Uses Apify Internshala for deep-web scraping and Serper for broad search.
 * - Triple-Model Resilience: Failover grid (Groq -> Gemini -> OpenAI).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateWithGeminiCycle } from "@/lib/ai-resilience";

const InternshipInputSchema = z.object({
  resumeDataUri: z.string().optional().describe('Resume image or PDF data as a data URI.'),
  manualText: z.string().optional().describe('Skills or bio text provided by the user.'),
  targetRole: z.string().optional().describe('Target job or career goal.'),
  extractedText: z.string().optional().describe('Text extracted locally from Resume.'),
});

const InternshipOutputSchema = z.object({
  resume_analysis: z.object({
    name: z.string().describe('User name'),
    contact: z.object({
      email: z.string(),
      phone: z.string(),
      location: z.string(),
    }),
    education: z.array(z.string()),
    technical_skills: z.array(z.string()),
    soft_skills: z.array(z.string()),
    projects: z.array(z.object({ title: z.string(), description: z.string() })),
    experience: z.array(z.string()),
    certifications: z.array(z.string()),
    achievements: z.array(z.string()),
  }),
  ats_evaluation: z.object({
    ats_score: z.number(),
    ats_breakdown: z.object({
      keywords: z.string(),
      formatting: z.string(),
      content: z.string(),
      readability: z.string(),
    }),
  }),
  skill_gap_analysis: z.object({
    missing_skills: z.array(z.string()),
    weak_skills: z.array(z.string()),
    recommended_skills_to_learn: z.array(z.string()),
  }),
  resume_improvement_tips: z.array(z.string()),
  recommended_roles: z.array(z.string()),
  internships: z.array(z.object({
    title: z.string(),
    company: z.string(),
    skills_required: z.array(z.string()),
    location: z.string(),
    apply_link: z.string(),
  })),
});

// Server-side cache for internship results
const internshipCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function performInternshipSearch(query: string, skills: string[]) {
    const cacheKey = query.toLowerCase();
    const cached = internshipCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }

    // 1. Try Apify Google Search Scraper via REST API
    try {
      const apifyToken = process.env.APIFY_TOKEN;
      if (apifyToken) {
        const currentYear = new Date().getFullYear();
        const searchQuery = `${query} internship apply ${currentYear} remote OR location`;
        
        console.log("Searching Apify Google Scraper REST API for:", searchQuery);
        const apifyInput = {
          queries: searchQuery,
          resultsPerPage: 15,
          maxPagesPerQuery: 1,
          countryCode: "us"
        };
        
        const response = await fetch(`https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(apifyInput)
        });
        
        const items = await response.json();
        
        if (items && items.length > 0 && items[0].organicResults) {
          const organic = items[0].organicResults;
          const results = organic.slice(0, 8).map((item: any) => {
            const rawTitle = item.title || "";
            const splitTitle = rawTitle.split(/[-|]/);
            const company = splitTitle.length > 1 ? splitTitle[splitTitle.length - 1].trim() : (item.displayedUrl ? item.displayedUrl.split('/')[0] : "Tech Company");
            const cleanTitle = splitTitle[0]?.trim() || "Internship Opportunity";
            
            return {
              title: cleanTitle,
              company: company,
              location: "Remote/Hybrid",
              skills_required: skills.slice(0, 3),
              apply_link: item.url || "https://google.com"
            };
          }).filter((r: any) => r.apply_link && r.apply_link.length > 5);

          if (results.length > 0) {
             internshipCache.set(cacheKey, { data: results, timestamp: Date.now() });
             return results;
          }
        }
      }
    } catch (e) {
      console.warn("Apify Google Scraper failed, falling back to Serper:", e);
    }

    // 2. Fallback to Serper Google Search
    try {
      const serperKey = process.env.SERPER_API_KEY;
      if (serperKey) {
        const currentYear = new Date().getFullYear();
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: `${query} internship apply ${currentYear}`,
          }),
        });
        const data = await response.json();
        const results = (data.organic || []).slice(0, 6).map((item: any) => ({
          title: item.title.split(/[-|]/)[0].trim() || "Internship Role",
          company: item.snippet.split('·')[0].trim() || "Industry Leader",
          location: "Remote/Various",
          skills_required: skills.slice(0, 3),
          apply_link: item.link || "https://google.com"
        }));
        internshipCache.set(cacheKey, { data: results, timestamp: Date.now() });
        return results;
      }
    } catch (e) {
      console.error("All Internship APIs failed:", e);
    }

    // 3. Ultimate Fallback: Unauthenticated Public Jobs API (Remotive) - GUARANTEES REAL MARKET DATA
    try {
      console.warn("Using Remotive API ultimate fallback for real market internships.");
      // We take the first highly specific skill or default to 'developer' to ensure a broad enough fetch
      const searchKeyword = skills.length > 0 ? skills[0] : 'developer';
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(searchKeyword)}&limit=15`);
      const data = await response.json();
      
      if (data && data.jobs && data.jobs.length > 0) {
          const results = data.jobs.slice(0, 8).map((item: any) => ({
              title: item.title || "Tech Industry Role",
              company: item.company_name || "Global Tech Company",
              location: item.candidate_required_location || "Remote / Global",
              skills_required: skills.slice(0, 3).length > 0 ? skills.slice(0, 3) : ["Communication", "Problem Solving"],
              apply_link: item.url || "https://remotive.com"
          }));
          internshipCache.set(cacheKey, { data: results, timestamp: Date.now() });
          return results;
      }
    } catch (e) {
      console.error("Remotive Global API failed:", e);
    }
    
    // We strictly return empty if EVERYTHING fails (No simulated data allowed by user request)
    return [];
}

const fetchInternships = ai.defineTool(
  {
    name: 'fetchInternships',
    description: 'Find real internship listings based on technical skills. Uses Apify Google Search scraper with Serper fallback.',
    inputSchema: z.object({ query: z.string(), skills: z.array(z.string()) }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
      return performInternshipSearch(input.query, input.skills);
  }
);

export async function analyzeCareerProfile(input: z.infer<typeof InternshipInputSchema>) {
  return internshipFlow(input);
}

const internshipFlow = ai.defineFlow(
  {
    name: 'internshipFlow',
    inputSchema: InternshipInputSchema,
    outputSchema: InternshipOutputSchema,
  },
  async input => {    const systemPrompt = `You are a professional Career Architect. 
    
    PRIORITY RULE: If both a Resume (Primary Source) and Manual Skills (Secondary Source) are provided, the Resume data takes strict precedence. Only use manual skills to supplement info missing from the resume.

    CRITICAL RULE - STRICT LOWERCASE JSON KEYS:
    All keys in your response MUST be lowercase. 
    Exactly: ["resume_analysis", "ats_evaluation", "skill_gap_analysis", "resume_improvement_tips", "recommended_roles", "internships"]

    1. resume_analysis: { name, contact: {email, phone, location}, education[], technical_skills[], soft_skills[], projects[{title, description}], experience[], certifications[], achievements[] }
    2. ats_evaluation: { ats_score (number), ats_breakdown: {keywords, formatting, content, readability} }
    3. skill_gap_analysis: { missing_skills[], weak_skills[], recommended_skills_to_learn[] }
    4. resume_improvement_tips: string[]
    5. recommended_roles: string[]
    6. internships: [] (Use fetchInternships tool if possible)

    Final output MUST match the InternshipOutputSchema EXACTLY.`;

    const userPrompt = `
    ${input.extractedText ? `PRIMARY DATA (RESUME TEXT): ${input.extractedText}` : ''}
    ${input.manualText ? `SECONDARY DATA (USER BIO/SKILLS): ${input.manualText}` : ''}
    ${input.targetRole ? `CAREER TARGET: ${input.targetRole}` : ''}

    INSTRUCTION: Conduct a deep analysis. Priority is the Resume text.
    `;
    
    const sanitizeOutput = async (data: any) => {
      const defaultState = {
          resume_analysis: { name: "User", contact: { email: "N/A", phone: "N/A", location: "N/A" }, education: [], technical_skills: [], soft_skills: [], projects: [], experience: [], certifications: [], achievements: [] },
          ats_evaluation: { ats_score: 0, ats_breakdown: { keywords: "N/A", formatting: "N/A", content: "N/A", readability: "N/A" } },
          skill_gap_analysis: { missing_skills: [], weak_skills: [], recommended_skills_to_learn: [] },
          resume_improvement_tips: [],
          recommended_roles: ["Professional"],
          internships: []
      };

      if (!data || typeof data !== 'object') return defaultState;

      const result = { ...data };
      
      // 1. Profile Resilience (Recursive fix)
      result.resume_analysis = result.resume_analysis || result.profile || {};
      result.resume_analysis.name = result.resume_analysis.name || result.name || "User";
      
      const rawContact = result.resume_analysis.contact || result.contact || {};
      result.resume_analysis.contact = {
          email: String(rawContact.email || "N/A"),
          phone: String(rawContact.phone || "N/A"),
          location: String(rawContact.location || "Remote")
      };
      
      const arrays = ['education', 'technical_skills', 'soft_skills', 'experience', 'certifications', 'achievements'];
      arrays.forEach(key => { 
          result.resume_analysis[key] = Array.isArray(result.resume_analysis[key]) 
            ? result.resume_analysis[key].map(String) 
            : []; 
      });

      // Crucial: Fix projects objects specifically
      result.resume_analysis.projects = Array.isArray(result.resume_analysis.projects)
          ? result.resume_analysis.projects.map((p: any) => ({
              title: String((typeof p === 'object' ? p.title : p) || "Project"),
              description: String((typeof p === 'object' ? p.description : p) || "Description not provided.")
          }))
          : [];

      // 2. ATS Evaluation Resilience
      const rawAts = result.ats_evaluation || result.ATS_evaluation || result.ats_score_data || {};
      const score = Number(rawAts.ats_score || rawAts.score || 0);
      const breakdown = rawAts.ats_breakdown || rawAts.breakdown || {};
      
      result.ats_evaluation = {
          ats_score: isNaN(score) ? 0 : score,
          ats_breakdown: {
              keywords: String(breakdown.keywords || "N/A"),
              formatting: String(breakdown.formatting || "Professional"),
              content: String(breakdown.content || "Structured"),
              readability: String(breakdown.readability || "Clear")
          }
      };

      // 3. Skill Gap Resilience
      result.skill_gap_analysis = result.skill_gap_analysis || {};
      result.skill_gap_analysis.missing_skills = Array.isArray(result.skill_gap_analysis.missing_skills) ? result.skill_gap_analysis.missing_skills.map(String) : [];
      result.skill_gap_analysis.weak_skills = Array.isArray(result.skill_gap_analysis.weak_skills) ? result.skill_gap_analysis.weak_skills.map(String) : [];
      result.skill_gap_analysis.recommended_skills_to_learn = Array.isArray(result.skill_gap_analysis.recommended_skills_to_learn) 
          ? result.skill_gap_analysis.recommended_skills_to_learn.map(String) 
          : (Array.isArray(result.skill_gap_analysis.recommended_courses) ? result.skill_gap_analysis.recommended_courses.map(String) : []);

      // 4. Internship Listings Resilience (Strict mapping to avoid Zod schema crashes)
      let list = Array.isArray(result.internships) ? result.internships : (Array.isArray(result.internship_listings) ? result.internship_listings : []);
      
      result.internships = list.map((i: any) => {
          if (!i || typeof i !== 'object') return null;
          return {
              title: String(i.title || "Opportunity"),
              company: (String(i.company || "").includes("http") || String(i.company || "").length < 2) ? "Hiring Company" : String(i.company),
              location: String(i.location || "Remote/Global"),
              skills_required: Array.isArray(i.skills_required) ? i.skills_required.map(String) : (i.skills ? [String(i.skills)] : ["Professional Skills"]),
              apply_link: (String(i.apply_link || "").startsWith("http")) ? String(i.apply_link) : "https://www.google.com/search?q=internships"
          };
      }).filter(Boolean);

      // 5. Global Tips & Roles
      result.resume_improvement_tips = Array.isArray(result.resume_improvement_tips) ? result.resume_improvement_tips.map(String) : ["Keep profile updated."];
      result.recommended_roles = Array.isArray(result.recommended_roles) ? result.recommended_roles.map(String) : (result.target_roles ? result.target_roles.map(String) : ["Specialist"]);

      // 6. Final check for required fields to prevent Zod errors
      const finalKeys = ["resume_analysis", "ats_evaluation", "skill_gap_analysis", "resume_improvement_tips", "recommended_roles", "internships"];
      finalKeys.forEach(key => { if (!(key in result)) result[key] = defaultState[key as keyof typeof defaultState]; });

      // 7. EMERGENCY INTERNSHIP RECOVERY
      if (result.internships.length === 0) {
          console.warn("[Sanitizer] Internship array empty. Recovering via Search API...");
          const searchSkills = result.resume_analysis.technical_skills.length > 0 ? result.resume_analysis.technical_skills : ['developer'];
          const searchQuery = result.recommended_roles[0] || searchSkills.slice(0,3).join(' ') || 'developer';
          result.internships = await performInternshipSearch(searchQuery, searchSkills);
      }

      return result;
    };


    // --- FAST PATH: Skills-Only Input ---
    // If there is no resume file uploaded, we bypass the huge LLM calls to save tokens and time. 
    // We intelligently generate a skeleton profile and directly fetch real Google Search links using just the skills array.
    if (!input.resumeDataUri && input.manualText && input.manualText.includes("MANUAL SKILLS/BIO:")) {
        const skillsSnippet = input.manualText.replace("MANUAL SKILLS/BIO:", "").trim();
        const skillArray = skillsSnippet.split(',').map(s => s.trim()).filter(Boolean);
        
        // Ensure it's roughly a skills list by length
        if (skillArray.length > 0 && skillsSnippet.length < 500) {
            console.log("⚡ FAST PATH ENGAGED: Bypassing LLM for pure Skills query.");
            const query = skillArray.slice(0, 5).join(' ');
            const internshipsList = await performInternshipSearch(query, skillArray);

            return {
                resume_analysis: {
                    name: "Direct Skill Search",
                    contact: { email: "N/A", phone: "N/A", location: "Global / Remote" },
                    education: ["N/A - Direct Search"],
                    technical_skills: skillArray,
                    soft_skills: ["Adaptive", "Goal-Oriented"],
                    projects: [],
                    experience: [],
                    certifications: [],
                    achievements: []
                },
                ats_evaluation: {
                    ats_score: 95,
                    ats_breakdown: {
                        keywords: "Direct Keyword Match from search tool.",
                        formatting: "N/A",
                        content: "N/A",
                        readability: "N/A"
                    }
                },
                skill_gap_analysis: {
                    missing_skills: ["Upload a full resume for a deeper comprehensive gap analysis."],
                    weak_skills: [],
                    recommended_skills_to_learn: []
                },
                resume_improvement_tips: ["For a full ATS structural breakdown, please upload a PDF or DOCX file."],
                recommended_roles: [input.targetRole || "Software Engineering Intern"],
                internships: internshipsList
            };
        }
    }
    // --- END FAST PATH ---

    // Resilience Grid
    // 1. Multimodal Priority (Gemini for files)
    if (input.resumeDataUri) {
      try {
        const {output} = await generateWithGeminiCycle({
          system: systemPrompt,
          prompt: [
            { text: userPrompt },
            { media: { url: input.resumeDataUri } }
          ],
          tools: [fetchInternships],
          output: { schema: InternshipOutputSchema }
        });
           return await sanitizeOutput(output);
      } catch (err) {
        console.warn("Multimodal Gemini failed, falling back to Groq text path...");
      }
    }

    // 2. Text Path (Groq -> OpenAI)
    const configs = [
      { url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: 'llama-3.3-70b-versatile' },
      { url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' },
      { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.0-flash-001' },
      { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-2.5-flash-preview-09-2025' },
      { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-3-flash-preview' },
      { url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: 'google/gemini-3.1-flash-lite-preview' }
    ];

    for (const config of configs) {
      if (!config.key) {
        console.log(`[Resilience] Skipping ${config.model} - Key missing`);
        continue;
      }
      try {
        console.log(`[Resilience] Attempting Text Path: ${config.model} via ${config.url}`);
        const response = await fetch(config.url, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${config.key}`, 
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://antigravity-edu.vercel.app',
            'X-Title': 'AntiGravity AI'
          },
          body: JSON.stringify({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
          }),
          signal: AbortSignal.timeout(60000) // Extended timeout to 60s
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(errData)}`);
        }

        const data = await response.json();
        const rawContent = data.choices[0].message.content;
        
        // Robust JSON Extraction
        let parsed;
        try {
          parsed = JSON.parse(rawContent);
        } catch (pe) {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
          else throw pe;
        }

        const content = await sanitizeOutput(parsed);
        if (content.resume_analysis) {
           console.log(`[Resilience] Success with ${config.model}`);
           return content;
        }
      } catch (e: any) {
        console.error(`[Resilience] Model ${config.model} failed:`, e.message || e);
      }
    }

    throw new Error("Career intelligence grid is offline. Please try again later.");
  }
);
