import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { TrainingMissionData } from '../../data/trainingMissions';
import {
  GameProxim8,
  MissionApproach,
  Proxim8Personality,
} from '../../generated/prisma';
import { PhaseOutcome } from './missionService';

export interface NarrativeContext {
  missionTemplate: TrainingMissionData;
  proxim8: GameProxim8;
  approach: MissionApproach;
  phaseId: number;
  phaseSuccess: boolean;
  previousPhases: PhaseOutcome[];
  agentCodename?: string;
}

export interface GeneratedNarrative {
  text: string;
  tone: 'success' | 'failure' | 'neutral';
  metadata?: {
    keywords?: string[];
    sentiment?: number;
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface MissionBriefing {
  title: string;
  overview: string;
  objectives: string[];
  risks: string[];
  personalizedNote?: string;
}

export class AIService {
  private static geminiModel = google('gemini-1.5-pro');

  /**
   * Generate dynamic narrative for a mission phase
   */
  static async generatePhaseNarrative(
    context: NarrativeContext
  ): Promise<GeneratedNarrative> {
    const {
      missionTemplate,
      proxim8,
      approach,
      phaseId,
      phaseSuccess,
      previousPhases,
      agentCodename,
    } = context;

    // Get the phase template
    const phaseTemplate = missionTemplate.phases.find((p) => p.id === phaseId);
    if (!phaseTemplate) {
      throw new Error(`Phase ${phaseId} not found in mission template`);
    }

    // Use template narrative as fallback
    const templateNarrative = phaseSuccess
      ? phaseTemplate.narrativeTemplates.success
      : phaseTemplate.narrativeTemplates.failure;

    try {
      // Create context for AI generation
      const personalityTraits = AIService.getPersonalityTraits(
        proxim8.personality
      );
      const approachDescription =
        missionTemplate.approaches.find((a) => a.type === approach)
          ?.description || approach;

      const previousPhaseSummary =
        previousPhases.length > 0
          ? previousPhases
              .map(
                (p) =>
                  `Phase ${p.phaseId}: ${p.success ? 'Success' : 'Failure'}`
              )
              .join(', ')
          : 'This is the first phase';

      const prompt = `
You are an AI narrative generator for a cyberpunk resistance mission system. Generate a dynamic, immersive narrative for a mission phase.

MISSION CONTEXT:
- Mission: ${missionTemplate.title}
- Location: ${missionTemplate.location}
- Date: ${missionTemplate.date}
- Threat Level: ${missionTemplate.briefing.threatLevel}
- Current Balance: ${missionTemplate.briefing.currentBalance}%

PROXIM8 CONTEXT:
- Name: ${proxim8.name}
- Personality: ${proxim8.personality} (${personalityTraits})
- Level: ${proxim8.level}
- Experience: ${proxim8.experience}
- Agent Codename: ${agentCodename || 'Unknown Agent'}

MISSION DETAILS:
- Approach: ${approachDescription}
- Current Phase: ${phaseTemplate.name} (${phaseId}/5)
- Phase Outcome: ${phaseSuccess ? 'SUCCESS' : 'FAILURE'}
- Previous Phases: ${previousPhaseSummary}

TEMPLATE BASELINE:
"${templateNarrative}"

Generate a narrative that:
1. Expands on the template with specific details and personality
2. Shows how the Proxim8's actions and personality influenced the outcome
3. Maintains the cyberpunk resistance theme
4. Is 2-3 sentences long
5. Uses vivid, technical language appropriate for the setting
6. References the specific approach being used

Respond with ONLY the narrative text, no explanations or meta-commentary.
      `;

      const result = await generateText({
        model: AIService.geminiModel,
        prompt,
        maxTokens: 150,
        temperature: 0.7,
      });

      return {
        text: result.text.trim(),
        tone: phaseSuccess ? 'success' : 'failure',
        metadata: {
          sentiment: phaseSuccess ? 0.7 : -0.3,
          urgency:
            missionTemplate.briefing.threatLevel === 'critical'
              ? 'high'
              : missionTemplate.briefing.threatLevel === 'high'
                ? 'medium'
                : 'low',
        },
      };
    } catch (error) {
      console.error('AI narrative generation failed, using template:', error);

      // Fallback to template with basic personalization
      const personalizedNarrative = templateNarrative.replace(
        /Proxim8/g,
        proxim8.name
      );

      return {
        text: personalizedNarrative,
        tone: phaseSuccess ? 'success' : 'failure',
        metadata: {
          sentiment: phaseSuccess ? 0.5 : -0.5,
          urgency: 'medium',
        },
      };
    }
  }

  /**
   * Generate a personalized mission briefing
   */
  static async generateMissionBriefing(
    missionTemplate: TrainingMissionData,
    proxim8: GameProxim8,
    agentStats: { rank: string; timelinePoints: number; successRate: number }
  ): Promise<MissionBriefing> {
    try {
      const personalityTraits = AIService.getPersonalityTraits(
        proxim8.personality
      );

      const prompt = `
You are briefing a resistance operative for a critical mission. Generate a personalized mission briefing.

MISSION CONTEXT:
- Mission: ${missionTemplate.title}
- Description: ${missionTemplate.description}
- Location: ${missionTemplate.location}
- Date: ${missionTemplate.date}
- Duration: ${missionTemplate.duration / (60 * 1000)} minutes
- Threat Level: ${missionTemplate.briefing.threatLevel}
- Current Timeline Balance: ${missionTemplate.briefing.currentBalance}%

AGENT PROFILE:
- Rank: ${agentStats.rank}
- Timeline Points: ${agentStats.timelinePoints}
- Success Rate: ${agentStats.successRate}%

PROXIM8 PROFILE:
- Name: ${proxim8.name}
- Personality: ${proxim8.personality} (${personalityTraits})
- Level: ${proxim8.level}
- Experience: ${proxim8.experience}

APPROACHES AVAILABLE:
${missionTemplate.approaches.map((a) => `- ${a.name}: ${a.description}`).join('\n')}

COMPATIBILITY:
- Preferred Personalities: ${missionTemplate.compatibility.preferred.join(', ')}
- Your Proxim8 ${missionTemplate.compatibility.preferred.includes(proxim8.personality) ? 'IS' : 'is NOT'} optimally suited for this mission

Generate a briefing with:
1. A compelling 2-sentence overview
2. 3-4 specific objectives
3. 2-3 key risks/challenges
4. A personalized note acknowledging the agent's experience and Proxim8's capabilities

Use technical, cyberpunk language. Be concise but immersive.

Respond in JSON format:
{
  "overview": "...",
  "objectives": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "personalizedNote": "..."
}
      `;

      const result = await generateText({
        model: AIService.geminiModel,
        prompt,
        maxTokens: 400,
        temperature: 0.6,
      });

      const parsed = JSON.parse(result.text);

      return {
        title: missionTemplate.title,
        overview: parsed.overview,
        objectives: parsed.objectives,
        risks: parsed.risks,
        personalizedNote: parsed.personalizedNote,
      };
    } catch (error) {
      console.error('AI briefing generation failed, using template:', error);

      // Fallback to basic briefing
      return {
        title: missionTemplate.title,
        overview: missionTemplate.briefing.text,
        objectives: [
          'Infiltrate target systems',
          'Gather intelligence on Oneirocom operations',
          'Execute mission approach without detection',
        ],
        risks: [
          'Counter-surveillance protocols',
          'System security measures',
          'Timeline disruption consequences',
        ],
        personalizedNote: `${proxim8.name}'s ${proxim8.personality.toLowerCase()} nature will be ${
          missionTemplate.compatibility.preferred.includes(proxim8.personality)
            ? 'an asset'
            : 'a challenge'
        } for this operation.`,
      };
    }
  }

  /**
   * Generate mission completion summary
   */
  static async generateMissionSummary(
    missionTemplate: TrainingMissionData,
    proxim8: GameProxim8,
    phaseOutcomes: PhaseOutcome[],
    finalResult: { overallSuccess: boolean; timelineShift: number }
  ): Promise<string> {
    try {
      const successCount = phaseOutcomes.filter((p) => p.success).length;
      const phaseResults = phaseOutcomes
        .map(
          (p) =>
            `${missionTemplate.phases.find((phase) => phase.id === p.phaseId)?.name}: ${p.success ? 'Success' : 'Failure'}`
        )
        .join(', ');

      const prompt = `
Generate a mission completion summary for a cyberpunk resistance operation.

MISSION: ${missionTemplate.title}
PROXIM8: ${proxim8.name} (${proxim8.personality})
PHASE RESULTS: ${phaseResults}
OVERALL SUCCESS: ${finalResult.overallSuccess}
TIMELINE SHIFT: ${finalResult.timelineShift} points
SUCCESS RATE: ${successCount}/5 phases

Generate a 3-4 sentence summary that:
1. Acknowledges the Proxim8's performance
2. Highlights key achievements or failures
3. Notes the timeline impact
4. Uses cyberpunk terminology

Keep it concise but dramatic. Respond with ONLY the summary text.
      `;

      const result = await generateText({
        model: AIService.geminiModel,
        prompt,
        maxTokens: 200,
        temperature: 0.7,
      });

      return result.text.trim();
    } catch (error) {
      console.error('AI summary generation failed, using template:', error);

      return `${proxim8.name} completed the ${missionTemplate.title} mission with ${
        finalResult.overallSuccess ? 'success' : 'mixed results'
      }. The operation achieved ${phaseOutcomes.filter((p) => p.success).length} out of 5 objectives, ${
        finalResult.overallSuccess ? 'securing' : 'partially shifting'
      } the timeline by ${finalResult.timelineShift} points. ${
        finalResult.overallSuccess
          ? 'The resistance network has been strengthened.'
          : "Oneirocom's plans have been delayed, but vigilance remains crucial."
      }`;
    }
  }

  /**
   * Get personality trait descriptions
   */
  private static getPersonalityTraits(personality: Proxim8Personality): string {
    const traits = {
      ANALYTICAL: 'methodical, data-driven, strategic',
      AGGRESSIVE: 'direct, forceful, high-risk/high-reward',
      DIPLOMATIC: 'social, persuasive, network-focused',
      ADAPTIVE: 'flexible, versatile, context-aware',
    };

    return traits[personality] || 'unknown traits';
  }

  /**
   * Generate lore fragment for successful missions
   */
  static async generateLoreFragment(
    missionTemplate: TrainingMissionData,
    proxim8: GameProxim8
  ): Promise<string> {
    try {
      const prompt = `
Generate a lore fragment discovered during the mission "${missionTemplate.title}".

CONTEXT:
- Mission: ${missionTemplate.title}
- Location: ${missionTemplate.location}
- Proxim8: ${proxim8.name}
- Mission Description: ${missionTemplate.description}

Create a short (2-3 sentences) lore fragment that:
1. Reveals something about Oneirocom's plans or the resistance
2. Connects to the mission location and objectives
3. Uses cyberpunk terminology
4. Feels like classified intelligence or intercepted communications

Examples of good lore fragments:
- "Intercepted transmission reveals Project Memoriam harvesting childhood memories from social media metadata."
- "Security logs show Oneirocom testing consciousness transfer protocols in seventeen underground facilities."

Respond with ONLY the lore fragment text.
      `;

      const result = await generateText({
        model: AIService.geminiModel,
        prompt,
        maxTokens: 100,
        temperature: 0.8,
      });

      return result.text.trim();
    } catch (error) {
      console.error('Lore generation failed:', error);
      return `Intelligence fragment recovered from ${missionTemplate.location}: Oneirocom operations continue to expand their consciousness mapping protocols.`;
    }
  }

  /**
   * Health check for AI services
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    details: string;
  }> {
    try {
      const testResult = await generateText({
        model: AIService.geminiModel,
        prompt: 'Respond with exactly: "AI_SERVICE_HEALTHY"',
        maxTokens: 10,
        temperature: 0,
      });

      if (testResult.text.trim() === 'AI_SERVICE_HEALTHY') {
        return { status: 'healthy', details: 'AI service responding normally' };
      } else {
        return {
          status: 'degraded',
          details: 'AI service responding but with unexpected output',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        details: `AI service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
