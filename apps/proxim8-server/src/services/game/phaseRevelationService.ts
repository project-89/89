// Phase Revelation Service - Handles time-based phase revelation for mission progress
import { PhaseOutcome } from './trainingMissionGenerationService';

export interface RevealedPhaseData {
  phaseId: number;
  name: string;
  success: boolean;
  diceRoll: number;
  successThreshold: number;
  narrative: string;
  firstPersonReport: string;
  structuredData?: any;
  imagePrompt?: string;
  tensionLevel: string;
  revealedAt: Date;
}

export interface MissionProgressResponse {
  totalPhases: number;
  revealedPhases: RevealedPhaseData[];
  nextRevealTime: Date | null;
  missionStatus: 'active' | 'completed';
  overallProgress: number; // 0-100%
  timeRemaining: number; // milliseconds
}

export class PhaseRevelationService {
  
  /**
   * Get revealed phases based on current time
   */
  static getRevealedPhases(
    phaseOutcomes: PhaseOutcome[], 
    currentTime: Date = new Date()
  ): RevealedPhaseData[] {
    const revealedPhases: RevealedPhaseData[] = [];
    
    for (const phase of phaseOutcomes) {
      // Reveal phase if its reveal time has passed
      if (phase.revealTime && currentTime >= phase.revealTime) {
        revealedPhases.push({
          phaseId: phase.phaseId,
          name: phase.name,
          success: phase.success,
          diceRoll: phase.diceRoll,
          successThreshold: phase.successThreshold,
          narrative: phase.narrative,
          firstPersonReport: phase.firstPersonReport,
          structuredData: phase.structuredData,
          imagePrompt: phase.imagePrompt,
          tensionLevel: phase.tensionLevel,
          revealedAt: phase.revealTime
        });
      }
    }
    
    console.log(`📊 Revealed ${revealedPhases.length}/${phaseOutcomes.length} phases at ${currentTime.toLocaleTimeString()}`);
    return revealedPhases;
  }
  
  /**
   * Get next phase reveal time
   */
  static getNextRevealTime(
    phaseOutcomes: PhaseOutcome[],
    currentTime: Date = new Date()
  ): Date | null {
    const unrevealed = phaseOutcomes.filter(phase => 
      phase.revealTime && currentTime < phase.revealTime
    );
    
    if (unrevealed.length === 0) {
      return null; // All phases revealed
    }
    
    // Return the next reveal time
    unrevealed.sort((a, b) => a.revealTime!.getTime() - b.revealTime!.getTime());
    return unrevealed[0].revealTime!;
  }
  
  /**
   * Calculate overall mission progress (0-100%)
   */
  static calculateProgress(
    phaseOutcomes: PhaseOutcome[],
    completesAt: Date,
    currentTime: Date = new Date()
  ): number {
    const totalDuration = completesAt.getTime() - phaseOutcomes[0]?.revealTime?.getTime();
    const elapsed = currentTime.getTime() - phaseOutcomes[0]?.revealTime?.getTime();
    
    if (totalDuration <= 0) return 100;
    
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    return Math.round(progress);
  }
  
  /**
   * Get complete mission progress response
   */
  static getMissionProgress(
    phaseOutcomes: PhaseOutcome[],
    completesAt: Date,
    currentTime: Date = new Date()
  ): MissionProgressResponse {
    const revealedPhases = this.getRevealedPhases(phaseOutcomes, currentTime);
    const nextRevealTime = this.getNextRevealTime(phaseOutcomes, currentTime);
    const overallProgress = this.calculateProgress(phaseOutcomes, completesAt, currentTime);
    const timeRemaining = Math.max(0, completesAt.getTime() - currentTime.getTime());
    
    const missionStatus = currentTime >= completesAt ? 'completed' : 'active';
    
    return {
      totalPhases: phaseOutcomes.length,
      revealedPhases,
      nextRevealTime,
      missionStatus,
      overallProgress,
      timeRemaining
    };
  }
  
  /**
   * Check if mission should auto-complete (for cron jobs if needed later)
   */
  static shouldAutoComplete(
    completesAt: Date,
    currentTime: Date = new Date()
  ): boolean {
    return currentTime >= completesAt;
  }
  
  /**
   * Get revealed lore entry if mission is complete
   */
  static getRevealedLoreEntry(
    generatedLoreEntry: any,
    completesAt: Date,
    currentTime: Date = new Date()
  ): any | null {
    if (currentTime >= completesAt && generatedLoreEntry) {
      return {
        ...generatedLoreEntry,
        unlockedAt: completesAt,
        source: 'training_mission'
      };
    }
    return null;
  }
}