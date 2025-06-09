// Structured Narrative Service - Gemini structured output with JSON schemas
import { GoogleGenAI, Type } from "@google/genai";

// Import loreService with fallback
let LoreService: any;
try {
  LoreService = require('./loreService').LoreService;
} catch (error) {
  console.warn('LoreService not available, using fallback');
  LoreService = {
    getCoreLoreSummary: () => "Project 89 core timeline resistance operations in progress. Simulation breach protocols active."
  };
}

// JSON Schemas for structured output using correct @google/genai format
export const PhaseNarrativeSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "2-3 paragraph immersive narrative (150-250 words)"
    },
    firstPersonReport: {
      type: Type.STRING, 
      description: "2-3 sentence technical report from Proxim8's perspective"
    },
    keyEvents: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 key events that happened in this phase"
    },
    emotionalTone: {
      type: Type.STRING,
      enum: ["confident", "tense", "desperate", "triumphant", "analytical"],
      description: "Emotional tone of the phase"
    },
    technicalDetails: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific technical/cyberpunk details mentioned"
    }
  },
  required: ["narrative", "firstPersonReport", "keyEvents", "emotionalTone", "technicalDetails"]
};

export const MissionSummarySchema = {
  type: Type.OBJECT, 
  properties: {
    overallNarrative: {
      type: Type.STRING,
      description: "Complete mission story arc (300-500 words)"
    },
    animeImagePrompt: {
      type: Type.STRING, 
      description: "Detailed anime-style image generation prompt (100-150 words)"
    },
    loreFragment: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Title for this lore entry" },
        content: { type: Type.STRING, description: "Lore content for the database" },
        significance: { type: Type.STRING, description: "Why this mission matters to Project 89" },
        timelinePeriod: { type: Type.STRING, description: "When this mission takes place" },
        tags: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Tags for categorizing this lore"
        }
      },
      required: ["title", "content", "significance", "timelinePeriod", "tags"]
    },
    characterDevelopment: {
      type: Type.STRING,
      description: "How the Proxim8 agent evolved during this mission"
    },
    timelineImpact: {
      type: Type.STRING, 
      description: "Impact on the broader Project 89 timeline"
    }
  },
  required: ["overallNarrative", "animeImagePrompt", "loreFragment", "characterDevelopment", "timelineImpact"]
};

interface PhaseGenerationParams {
  phase: any;
  success: boolean;
  diceRoll: number;
  approach: any;
  proxim8: any;
  missionContext: any;
  previousPhases: any[];
  tensionLevel: string;
  cumulativeStory: string;
  phaseIndex: number;
  totalPhases: number;
}

interface MissionSummaryParams {
  template: any;
  approach: any;
  proxim8: any;
  phaseOutcomes: any[];
  overallSuccess: boolean;
  missionContext: any;
}

export class StructuredNarrativeService {
  private static genAI: GoogleGenAI | null = null;

  private static getGenAI(): GoogleGenAI {
    if (!this.genAI) {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
      }
      this.genAI = new GoogleGenAI({ apiKey });
    }
    return this.genAI;
  }

  /**
   * Generate structured phase narrative with JSON schema validation
   */
  static async generatePhaseNarrative(params: PhaseGenerationParams): Promise<any> {
    try {
      const genAI = this.getGenAI();
      const prompt = this.buildPhasePrompt(params);

      console.log(`🤖 Generating structured narrative for Phase ${params.phaseIndex + 1}: ${params.phase.name}`);

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-pro-preview-05-06",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: PhaseNarrativeSchema,
          temperature: 0.8,
          maxOutputTokens: 800
        }
      });

      // Sanitize and parse JSON response
      let responseText = response.text || '{}';
      
      // Fix common JSON issues from LLM responses
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      responseText = responseText.trim();
      
      // Try to fix unterminated strings by finding incomplete quotes
      if (responseText.includes('"') && !responseText.endsWith('}') && !responseText.endsWith(']')) {
        console.warn('⚠️ Detected potentially incomplete JSON response, attempting repair...');
        // Basic repair attempt - close unclosed string and object
        const lastQuoteIndex = responseText.lastIndexOf('"');
        const lastBraceIndex = responseText.lastIndexOf('}');
        if (lastQuoteIndex > lastBraceIndex) {
          responseText += '"';
        }
        if (!responseText.endsWith('}')) {
          responseText += '}';
        }
      }
      
      const structuredData = JSON.parse(responseText);
      console.log(`✅ Generated structured phase narrative`);
      return structuredData;

    } catch (error) {
      console.error('Error generating structured phase narrative:', error);
      return this.generateFallbackPhaseNarrative(params);
    }
  }

  /**
   * Generate comprehensive mission summary with structured output
   */
  static async generateMissionSummary(params: MissionSummaryParams): Promise<any> {
    try {
      const genAI = this.getGenAI();
      const prompt = this.buildMissionSummaryPrompt(params);

      console.log(`📖 Generating structured mission summary for: ${params.template.title}`);

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-pro-preview-05-06",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: MissionSummarySchema,
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      });

      // Sanitize and parse JSON response
      let responseText = response.text || '{}';
      
      // Fix common JSON issues from LLM responses
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      responseText = responseText.trim();
      
      // Try to fix unterminated strings by finding incomplete quotes
      if (responseText.includes('"') && !responseText.endsWith('}') && !responseText.endsWith(']')) {
        console.warn('⚠️ Detected potentially incomplete JSON response, attempting repair...');
        // Basic repair attempt - close unclosed string and object
        const lastQuoteIndex = responseText.lastIndexOf('"');
        const lastBraceIndex = responseText.lastIndexOf('}');
        if (lastQuoteIndex > lastBraceIndex) {
          responseText += '"';
        }
        if (!responseText.endsWith('}')) {
          responseText += '}';
        }
      }
      
      const structuredData = JSON.parse(responseText);
      console.log(`✅ Generated structured mission summary`);
      return structuredData;

    } catch (error) {
      console.error('Error generating structured mission summary:', error);
      return this.generateFallbackMissionSummary(params);
    }
  }

  /**
   * Build comprehensive prompt for phase generation
   */
  private static buildPhasePrompt(params: PhaseGenerationParams): string {
    const {
      phase, success, diceRoll, approach, proxim8, missionContext,
      previousPhases, tensionLevel, cumulativeStory, phaseIndex, totalPhases
    } = params;

    const failureCount = previousPhases.filter(p => !p.success).length;
    const progressPercent = Math.round(((phaseIndex + 1) / totalPhases) * 100);

    return `
GENERATE STRUCTURED MISSION PHASE CONTENT:

MISSION CONTEXT:
${LoreService.getCoreLoreSummary()}

RELEVANT LORE:
${missionContext.loreFragments.slice(0, 2).join('\n\n')}

PROXIM8 AGENT PROFILE:
- Name: ${proxim8.name || 'Agent'}
- Personality: ${proxim8.personality || 'analytical'}
- Background: ${missionContext.proxim8Background}
- Full Traits: ${proxim8.traits ? proxim8.traits.map((t: any) => `${t.trait_type}: ${t.value}`).join(', ') : 'Advanced AI capabilities'}
- NFT ID: ${proxim8.nftId || 'Unknown'}
- Previous Deployments: ${proxim8.missionCount || 0}
- Success Rate: ${proxim8.successRate || 'Unknown'}

MISSION HISTORY CONTEXT:
${missionContext.missionHistory.length > 0 ? 
  missionContext.missionHistory.slice(-2).map((h: string, i: number) => `Previous Mission ${i + 1}: ${h}`).join('\n') : 
  'This is the agent\'s first recorded mission.'}

CURRENT PHASE (${phaseIndex + 1}/${totalPhases} - ${progressPercent}% complete):
- Name: ${phase.name}
- Description: ${phase.description || 'Critical mission phase'}
- Dice Roll: ${diceRoll}/100 (${success ? 'SUCCESS' : 'FAILURE'})
- Tension Level: ${tensionLevel.toUpperCase()}
- Previous Failures: ${failureCount}

MISSION STATUS:
- Approach: ${approach.name} (${approach.description})
- Timeline Period: ${missionContext.timelinePeriod}

STORY SO FAR:
${cumulativeStory || 'Mission beginning...'}

REQUIREMENTS:
- Write immersive cyberpunk narrative (150-250 words)
- Include technical details appropriate to tension level
- Show Proxim8's ${proxim8.personality} personality
- ${success ? 'Show problem-solving and success' : 'Show adaptation despite setbacks'}
- Reference dice roll outcome naturally
- End with hook for next phase (unless final phase)
- Generate technical first-person report from Proxim8's perspective
- Extract key events and technical details
- Determine emotional tone based on outcomes

Generate structured JSON response following the schema.
    `.trim();
  }

  /**
   * Build comprehensive prompt for mission summary
   */
  private static buildMissionSummaryPrompt(params: MissionSummaryParams): string {
    const { template, approach, proxim8, phaseOutcomes, overallSuccess, missionContext } = params;
    
    const successCount = phaseOutcomes.filter(p => p.success).length;
    const allPhaseNarratives = phaseOutcomes.map(p => p.structuredData?.narrative || p.narrative).join('\n\n');
    
    return `
GENERATE COMPREHENSIVE MISSION SUMMARY:

MISSION: ${template.title}
OUTCOME: ${overallSuccess ? 'SUCCESS' : 'FAILURE'} (${successCount}/${phaseOutcomes.length} phases successful)
APPROACH: ${approach.name}
TIMELINE: ${missionContext.timelinePeriod}

PROXIM8 AGENT:
- Name: ${proxim8.name || 'Agent'}
- Personality: ${proxim8.personality || 'analytical'}

COMPLETE MISSION STORY:
${allPhaseNarratives}

PHASE OUTCOMES:
${phaseOutcomes.map((p, i) => `${i + 1}. ${p.name}: ${p.success ? 'SUCCESS' : 'FAILURE'} (${p.diceRoll}/100, ${p.tensionLevel})`).join('\n')}

REQUIREMENTS:
1. OVERALL NARRATIVE: Synthesize all phases into a cohesive 300-500 word story arc
2. ANIME IMAGE PROMPT: Detailed prompt for generating anime-style image of the climactic moment
3. LORE FRAGMENT: Create database entry with title, content, significance, period, and tags
4. CHARACTER DEVELOPMENT: How the Proxim8 evolved during this mission
5. TIMELINE IMPACT: Broader implications for Project 89's timeline manipulation

ANIME PROMPT GUIDELINES:
- Cyberpunk aesthetic with neon lighting
- Show Proxim8 agent in action during climactic moment
- Include environmental details (Neo-Tokyo, Oneirocom facilities, etc.)
- Capture the ${overallSuccess ? 'triumphant' : 'desperate'} mood
- Dynamic composition suitable for key visual

LORE FRAGMENT GUIDELINES:
- Title should reference mission and outcome
- Content should be 2-3 paragraphs documenting what happened
- Significance should explain impact on resistance/timeline
- Tags should include: mission type, year, location, key characters
- Write from perspective of Project 89 historical records

Generate structured JSON response following the schema.
    `.trim();
  }

  /**
   * Generate fallback structured data when AI fails
   */
  private static generateFallbackPhaseNarrative(params: PhaseGenerationParams): any {
    const { phase, success, tensionLevel } = params;
    
    return {
      narrative: success 
        ? `Phase ${phase.name} executed successfully. Proxim8 systems adapted to environmental variables with precision. Advanced algorithms processed threat matrices efficiently, maintaining optimal mission trajectory.`
        : `Phase ${phase.name} encountered complications. Unexpected variables introduced system challenges. Proxim8 initiated adaptive protocols, maintaining operational integrity despite setbacks.`,
      firstPersonReport: success
        ? `Phase ${phase.name} completed successfully. All system parameters remained within optimal ranges. Proceeding with calculated confidence to next objective.`
        : `Phase ${phase.name} faced unexpected variables. Recalibrating approach vectors for improved probability matrices. Failure data logged for optimization.`,
      keyEvents: [
        `${success ? 'Successful' : 'Attempted'} ${phase.name}`,
        "System adaptation protocols engaged",
        "Mission parameters updated"
      ],
      emotionalTone: tensionLevel === 'critical' ? 'desperate' : success ? 'confident' : 'tense',
      technicalDetails: [
        "Quantum encryption bypass",
        "Neural pathway analysis", 
        "Timeline fluctuation detected"
      ]
    };
  }

  /**
   * Generate fallback mission summary when AI fails
   */
  private static generateFallbackMissionSummary(params: MissionSummaryParams): any {
    const { template, overallSuccess, phaseOutcomes } = params;
    const successCount = phaseOutcomes.filter(p => p.success).length;
    
    return {
      overallNarrative: `Mission "${template.title}" concluded with ${overallSuccess ? 'success' : 'mixed results'}. ${successCount} of ${phaseOutcomes.length} phases completed successfully. The operation ${overallSuccess ? 'significantly weakened Oneirocom\'s timeline control' : 'provided valuable intelligence despite complications'}.`,
      animeImagePrompt: "Cyberpunk anime style, Proxim8 agent in futuristic Neo-Tokyo, neon lighting, dynamic action pose, detailed character design, cinematic composition",
      loreFragment: {
        title: `Mission Report: ${template.title}`,
        content: `Training mission executed by Project 89 operatives. Mission status: ${overallSuccess ? 'Successful' : 'Partially successful'}. Timeline manipulation protocols tested successfully.`,
        significance: "Demonstrates Project 89's growing capability in timeline operations",
        timelinePeriod: "Training Era",
        tags: ["training", "mission", "timeline", "proxim8"]
      },
      characterDevelopment: "Agent gained valuable experience in timeline manipulation protocols",
      timelineImpact: "Mission contributed to Project 89's understanding of temporal mechanics"
    };
  }
}