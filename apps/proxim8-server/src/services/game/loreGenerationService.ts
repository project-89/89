// Lore Generation Service - Extensible pattern for probabilistic lore generation
import { StructuredNarrativeService } from './structuredNarrativeService';

export interface LoreGenerationConfig {
  type: 'mission_report' | '89_canon' | 'character_evolution' | 'timeline_fragment' | 'resistance_intel';
  probability: number; // 0-1 probability this lore generates
  title: string;
  description: string;
  schema: any; // JSON schema for this lore type
  contextRequirements: string[]; // Required context fields
  unlockConditions: {
    missionSuccess?: boolean;
    phaseSuccessCount?: number;
    agentLevel?: number;
    timelinePeriod?: string[];
  };
}

export interface GeneratedLoreEntry {
  type: string;
  title: string;
  content: string;
  metadata: {
    generatedAt: Date;
    unlockTime: Date;
    source: string;
    probability: number;
    context: any;
  };
  tags: string[];
  significance: string;
}

export class LoreGenerationService {
  
  /**
   * Extensible lore generation configurations
   * Add new types here to expand lore generation capabilities
   */
  private static readonly LORE_CONFIGS: LoreGenerationConfig[] = [
    {
      type: 'mission_report',
      probability: 1.0, // Always generate mission reports
      title: 'Mission Report Generation',
      description: 'Creates detailed mission reports for database storage',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          classification: { type: 'string' },
          operatives: { type: 'array', items: { type: 'string' } },
          timelineImpact: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'string' } }
        }
      },
      contextRequirements: ['template', 'phaseOutcomes', 'proxim8', 'overallSuccess'],
      unlockConditions: {} // Always unlocks
    },
    
    {
      type: '89_canon',
      probability: 0.0, // DISABLED - Not ready for canon lore releases yet
      title: 'Project 89 Canon Lore',
      description: 'Generates new canonical Project 89 universe lore',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          canonLevel: { type: 'string', enum: ['primary', 'secondary', 'supplemental'] },
          timelinePeriod: { type: 'string' },
          connections: { type: 'array', items: { type: 'string' } },
          implications: { type: 'string' }
        }
      },
      contextRequirements: ['template', 'overallSuccess', 'missionContext'],
      unlockConditions: {
        missionSuccess: true,
        phaseSuccessCount: 4 // Require high performance
      }
    },
    
    {
      type: 'character_evolution',
      probability: 0.0, // DISABLED - Not ready for character evolution lore yet
      title: 'Character Evolution Entry',
      description: 'Documents Proxim8 agent development and growth',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          agentId: { type: 'string' },
          evolutionType: { type: 'string', enum: ['skill', 'personality', 'memory', 'capability'] },
          measurableChanges: { type: 'array', items: { type: 'string' } },
          psychologicalProfile: { type: 'string' }
        }
      },
      contextRequirements: ['proxim8', 'phaseOutcomes', 'missionContext'],
      unlockConditions: {
        phaseSuccessCount: 2 // Some success required
      }
    },
    
    {
      type: 'timeline_fragment',
      probability: 0.0, // DISABLED - Not ready for timeline fragment lore yet
      title: 'Timeline Fragment Discovery',
      description: 'Reveals new information about Project 89 timelines',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          timelineDesignation: { type: 'string' },
          divergencePoint: { type: 'string' },
          stabilityIndex: { type: 'number' },
          accessibleFrom: { type: 'array', items: { type: 'string' } }
        }
      },
      contextRequirements: ['template', 'approach', 'missionContext'],
      unlockConditions: {
        missionSuccess: true,
        timelinePeriod: ['2055', '2089'] // Only in certain periods
      }
    },
    
    {
      type: 'resistance_intel',
      probability: 0.0, // DISABLED - Not ready for resistance intel lore yet
      title: 'Resistance Intelligence Brief',
      description: 'Gathers intelligence on Oneirocom operations',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          targetOrganization: { type: 'string' },
          intelligenceType: { type: 'string', enum: ['tactical', 'strategic', 'technical', 'personnel'] },
          reliability: { type: 'string', enum: ['confirmed', 'probable', 'possible', 'unverified'] },
          actionableIntel: { type: 'array', items: { type: 'string' } }
        }
      },
      contextRequirements: ['template', 'phaseOutcomes', 'approach'],
      unlockConditions: {
        phaseSuccessCount: 1 // Minimal success required
      }
    }
  ];
  
  /**
   * Generate all applicable lore entries for a mission
   */
  static async generateMissionLore(
    missionData: {
      template: any;
      approach: any;
      proxim8: any;
      phaseOutcomes: any[];
      overallSuccess: boolean;
      missionContext: any;
    },
    completesAt: Date
  ): Promise<GeneratedLoreEntry[]> {
    const generatedLore: GeneratedLoreEntry[] = [];
    
    console.log('📚 Generating extensible lore entries...');
    
    for (const config of this.LORE_CONFIGS) {
      // Check unlock conditions
      if (!this.checkUnlockConditions(config, missionData)) {
        console.log(`  ⏭️  Skipping ${config.type}: conditions not met`);
        continue;
      }
      
      // Roll for probability
      const roll = Math.random();
      if (roll > config.probability) {
        console.log(`  🎲 Skipping ${config.type}: ${Math.round(roll * 100)}% > ${Math.round(config.probability * 100)}%`);
        continue;
      }
      
      console.log(`  ✅ Generating ${config.type} lore (${Math.round(roll * 100)}% ≤ ${Math.round(config.probability * 100)}%)`);
      
      try {
        const loreEntry = await this.generateSpecificLore(config, missionData, completesAt);
        if (loreEntry) {
          generatedLore.push(loreEntry);
        }
      } catch (error) {
        console.error(`  ❌ Failed to generate ${config.type} lore:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`📖 Generated ${generatedLore.length} lore entries total`);
    return generatedLore;
  }
  
  /**
   * Check if unlock conditions are met for a lore type
   */
  private static checkUnlockConditions(
    config: LoreGenerationConfig,
    missionData: any
  ): boolean {
    const conditions = config.unlockConditions;
    const { overallSuccess, phaseOutcomes, missionContext } = missionData;
    
    // Check mission success requirement
    if (conditions.missionSuccess !== undefined && conditions.missionSuccess !== overallSuccess) {
      return false;
    }
    
    // Check phase success count requirement
    if (conditions.phaseSuccessCount !== undefined) {
      const successCount = phaseOutcomes.filter((p: any) => p.success).length;
      if (successCount < conditions.phaseSuccessCount) {
        return false;
      }
    }
    
    // Check timeline period requirement
    if (conditions.timelinePeriod && missionContext.timelinePeriod) {
      const periodMatches = conditions.timelinePeriod.some(period => 
        missionContext.timelinePeriod.includes(period)
      );
      if (!periodMatches) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate specific lore entry using AI
   */
  private static async generateSpecificLore(
    config: LoreGenerationConfig,
    missionData: any,
    completesAt: Date
  ): Promise<GeneratedLoreEntry | null> {
    
    // For now, prioritize mission reports and use structured generation
    if (config.type === 'mission_report') {
      return await this.generateMissionReportLore(missionData, completesAt);
    }
    
    // For other types, use simplified generation (extend later with specific prompts)
    return {
      type: config.type,
      title: `${config.title}: ${missionData.template.title}`,
      content: `Generated ${config.description.toLowerCase()} for mission "${missionData.template.title}". This is a placeholder that would be enhanced with specific AI generation.`,
      metadata: {
        generatedAt: new Date(),
        unlockTime: completesAt,
        source: 'training_mission',
        probability: config.probability,
        context: { missionId: missionData.template.id }
      },
      tags: ['training', config.type, missionData.template.year?.toString() || 'unknown'],
      significance: `Mission-generated ${config.type} entry`
    };
  }
  
  /**
   * Generate mission report lore using structured AI generation
   */
  private static async generateMissionReportLore(
    missionData: any,
    completesAt: Date
  ): Promise<GeneratedLoreEntry> {
    
    // Use existing structured generation for mission reports
    try {
      const missionSummary = await StructuredNarrativeService.generateMissionSummary(missionData);
      
      return {
        type: 'mission_report',
        title: missionSummary?.loreFragment?.title || `Mission Report: ${missionData.template.title}`,
        content: missionSummary?.loreFragment?.content || 'Mission report generation failed, using fallback.',
        metadata: {
          generatedAt: new Date(),
          unlockTime: completesAt,
          source: 'training_mission_ai',
          probability: 1.0,
          context: {
            missionId: missionData.template.id,
            aiGenerated: true,
            overallSuccess: missionData.overallSuccess
          }
        },
        tags: missionSummary?.loreFragment?.tags || ['training', 'mission', 'ai_generated'],
        significance: missionSummary?.loreFragment?.significance || 'Training mission documentation'
      };
      
    } catch (error) {
      console.warn('AI generation failed, using fallback mission report');
      
      return {
        type: 'mission_report',
        title: `Mission Report: ${missionData.template.title}`,
        content: `Training mission "${missionData.template.title}" completed. Status: ${missionData.overallSuccess ? 'Success' : 'Partial Success'}. Agent performed ${missionData.phaseOutcomes.filter((p: any) => p.success).length}/${missionData.phaseOutcomes.length} phases successfully.`,
        metadata: {
          generatedAt: new Date(),
          unlockTime: completesAt,
          source: 'training_mission_fallback',
          probability: 1.0,
          context: { missionId: missionData.template.id }
        },
        tags: ['training', 'mission', 'fallback'],
        significance: 'Training mission documentation'
      };
    }
  }
}