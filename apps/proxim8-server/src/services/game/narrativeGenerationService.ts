// Narrative Generation Service - AI-powered story generation for missions

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { LoreService } from './loreService';

interface PhaseNarrativeParams {
  phase: any;
  success: boolean;
  diceRoll: number;
  approach: any;
  proxim8: any;
  missionContext: any;
  previousPhases: any[];
  tensionLevel: string;
  cumulativeStory: string;
}

interface FirstPersonReportParams {
  phase: any;
  success: boolean;
  approach: any;
  proxim8: any;
  narrative: string;
  tensionLevel: string;
}

export class NarrativeGenerationService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static model: GenerativeModel | null = null;
  
  /**
   * Initialize Gemini client
   */
  private static getModel(): GenerativeModel {
    if (!this.model) {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_GENERATIVE_AI_API_KEY environment variable is required');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro-preview-05-06" });
    }
    return this.model;
  }
  
  /**
   * Generate narrative for a specific mission phase
   */
  static async generatePhaseNarrative(params: PhaseNarrativeParams): Promise<string> {
    try {
      const {
        phase,
        success,
        diceRoll,
        approach,
        proxim8,
        missionContext,
        previousPhases,
        tensionLevel,
        cumulativeStory
      } = params;
      
      const model = this.getModel();
      
      // Build context-rich prompt (can be much larger with 1M token context!)
      const prompt = this.buildPhaseNarrativePrompt(params);
      
      console.log(`🤖 Generating narrative for ${phase.name} (${success ? 'SUCCESS' : 'FAILURE'})`);
      
      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: 'You are a master storyteller specializing in cyberpunk narratives and Project 89 lore. Write compelling, immersive mission phase narratives that build tension and character development. Focus on creating vivid, first-person perspective scenes that make the reader feel like they are the Proxim8 agent experiencing the mission.',
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 500
        }
      });
      
      const narrative = response.response.text().trim() || 
                       this.generateFallbackNarrative(phase, success, approach);
      
      console.log(`✅ Generated ${narrative.length} character narrative`);
      return narrative;
      
    } catch (error) {
      console.error('Error generating phase narrative:', error);
      return this.generateFallbackNarrative(params.phase, params.success, params.approach);
    }
  }
  
  /**
   * Generate first-person mission report from Proxim8's perspective
   */
  static async generateFirstPersonReport(params: FirstPersonReportParams): Promise<string> {
    try {
      const { phase, success, approach, proxim8, narrative, tensionLevel } = params;
      
      const model = this.getModel();
      
      const prompt = `
WRITE A FIRST-PERSON MISSION REPORT FROM PROXIM8'S PERSPECTIVE:

PROXIM8 PROFILE:
- Name: ${proxim8.name || 'Agent'}
- Personality: ${proxim8.personality || 'analytical'}
- Traits: ${proxim8.traits ? proxim8.traits.map((t: any) => t.value).join(', ') : 'tactical, precise'}

PHASE: ${phase.name}
OUTCOME: ${success ? 'SUCCESS' : 'FAILURE'}  
TENSION: ${tensionLevel}
APPROACH: ${approach.name}

PHASE NARRATIVE CONTEXT:
${narrative}

Write a 2-3 sentence first-person report from the Proxim8's perspective. Use technical language mixed with personality-specific observations. Sound like an AI agent reporting back to command.

Format: Direct, professional report with personality showing through word choice and focus.
      `.trim();
      
      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        systemInstruction: 'You are a Proxim8 AI agent writing concise first-person mission reports. Blend technical precision with subtle personality traits. Use "I" perspective and sound like an advanced AI reporting to human command.',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      });
      
      return response.response.text().trim() || 
             this.generateFallbackReport(phase, success, proxim8);
             
    } catch (error) {
      console.error('Error generating first-person report:', error);
      return this.generateFallbackReport(params.phase, params.success, params.proxim8);
    }
  }
  
  /**
   * Build comprehensive prompt for phase narrative generation
   */
  private static buildPhaseNarrativePrompt(params: PhaseNarrativeParams): string {
    const {
      phase,
      success,
      diceRoll,
      approach,
      proxim8,
      missionContext,
      previousPhases,
      tensionLevel,
      cumulativeStory
    } = params;
    
    const failureCount = previousPhases.filter(p => !p.success).length;
    const momentum = failureCount > 1 ? 'declining' : failureCount === 1 ? 'uncertain' : 'building';
    
    return `
GENERATE MISSION PHASE NARRATIVE:

MISSION CONTEXT:
${LoreService.getCoreLoreSummary()}

RELEVANT LORE:
${missionContext.loreFragments.join('\n\n')}

PROXIM8 AGENT:
- Name: ${proxim8.name || 'Agent'}
- Personality: ${proxim8.personality || 'analytical'} 
- Background: ${missionContext.proxim8Background}
- Traits: ${proxim8.traits ? proxim8.traits.map((t: any) => `${t.trait_type}: ${t.value}`).join(', ') : 'Advanced AI capabilities'}

CURRENT PHASE:
- Name: ${phase.name}
- Description: ${phase.description || 'Critical mission phase'}
- Dice Roll: ${diceRoll}/100
- Outcome: ${success ? 'SUCCESS' : 'FAILURE'}
- Tension Level: ${tensionLevel.toUpperCase()}

MISSION STATUS:
- Approach: ${approach.name} (${approach.description})
- Previous Failures: ${failureCount}/5
- Mission Momentum: ${momentum}
- Timeline Period: ${missionContext.timelinePeriod}

PREVIOUS STORY:
${cumulativeStory || 'Mission just beginning...'}

REQUIREMENTS:
- Write 2-3 paragraphs (150-250 words)
- Build tension appropriate to ${tensionLevel} level
- Reference the dice roll outcome naturally
- Show Proxim8's ${proxim8.personality} personality
- Include specific technical/cyberpunk details
- ${success ? 'Show clever problem-solving and success' : 'Show complications, adaptation, and determination despite setbacks'}
- Connect to broader Project 89 narrative
- End with hook for next phase
    `.trim();
  }
  
  /**
   * Generate fallback narrative when AI generation fails
   */
  private static generateFallbackNarrative(phase: any, success: boolean, approach: any): string {
    const templates = {
      success: [
        `Phase ${phase.name}: Proxim8 systems executed flawlessly, adapting to environmental variables with precision. Target parameters achieved within acceptable thresholds.`,
        `${phase.name} complete: Advanced algorithms processed threat matrices successfully. Mission progression maintains optimal trajectory.`,
        `Phase successful: Proxim8 navigation protocols bypassed security measures efficiently. Objective markers satisfied, proceeding to next phase.`
      ],
      failure: [
        `Phase ${phase.name}: Unexpected variables introduced system complications. Proxim8 initiated adaptive protocols, maintaining operational integrity despite setbacks.`,
        `${phase.name} encountered resistance: Security countermeasures exceeded initial projections. Proxim8 systems adapted, seeking alternative solution vectors.`,
        `Phase complications detected: Environmental parameters shifted beyond optimal ranges. Proxim8 resilience protocols engaged, mission continues.`
      ]
    };
    
    const pool = success ? templates.success : templates.failure;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  /**
   * Generate fallback first-person report when AI generation fails
   */
  private static generateFallbackReport(phase: any, success: boolean, proxim8: any): string {
    const personality = proxim8.personality || 'analytical';
    const name = phase.name;
    
    if (success) {
      switch (personality) {
        case 'analytical':
          return `Phase ${name} completed successfully. All system parameters remained within optimal ranges. Proceeding with calculated confidence to next objective.`;
        case 'aggressive':
          return `${name} phase dominated. Target elimination exceeded expectations. Ready to push harder on the next engagement.`;
        case 'diplomatic':
          return `${name} phase completed through strategic negotiation. Relationships maintained while achieving objectives. Social dynamics remain favorable.`;
        default:
          return `${name} phase successful. Adaptation protocols proved effective. Mission momentum building positively.`;
      }
    } else {
      switch (personality) {
        case 'analytical':
          return `${name} phase encountered unexpected variables. Recalibrating approach vectors for improved probability matrices. Failure data logged for learning optimization.`;
        case 'aggressive':
          return `${name} phase met heavy resistance. Regrouping for tactical reassessment. The challenge only sharpens my focus for the next assault.`;
        case 'diplomatic':
          return `${name} phase revealed complex social dynamics. Building alternative consensus routes. Setback provides valuable relationship intelligence.`;
        default:
          return `${name} phase faced complications. Adaptive systems engaged successfully. Resilience protocols maintaining operational integrity.`;
      }
    }
  }
}