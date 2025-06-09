// Lore Service - Manages lore documents and context for mission generation

import fs from 'fs';
import path from 'path';

export interface LoreFragment {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timeperiod: string;
  location: string;
  relevance: number;
}

export class LoreService {
  private static loreCache: LoreFragment[] | null = null;
  
  /**
   * Get relevant lore fragments for a mission based on time period and location
   */
  static async getRelevantLore(year: number, location: string): Promise<string[]> {
    const allLore = await this.getAllLore();
    
    // Filter by time period relevance
    const relevantLore = allLore.filter(fragment => {
      const yearMatch = this.isTimeperiodRelevant(fragment.timeperiod, year);
      const locationMatch = fragment.location.toLowerCase().includes(location.toLowerCase()) ||
                           location.toLowerCase().includes(fragment.location.toLowerCase()) ||
                           fragment.location === 'global';
      
      return yearMatch || locationMatch;
    });
    
    // Sort by relevance and return top fragments
    relevantLore.sort((a, b) => b.relevance - a.relevance);
    
    return relevantLore.slice(0, 3).map(fragment => 
      `**${fragment.title}**\n${fragment.content}`
    );
  }
  
  /**
   * Load all lore documents from the docs/lore directory
   */
  static async getAllLore(): Promise<LoreFragment[]> {
    if (this.loreCache) {
      return this.loreCache;
    }
    
    const loreDir = path.join(process.cwd(), '../docs/lore');
    const loreFragments: LoreFragment[] = [];
    
    try {
      if (!fs.existsSync(loreDir)) {
        console.warn('Lore directory not found:', loreDir);
        return [];
      }
      
      const files = fs.readdirSync(loreDir);
      
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(loreDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Parse metadata from markdown frontmatter or filename
          const fragment = this.parseLoreDocument(file, content);
          if (fragment) {
            loreFragments.push(fragment);
          }
        }
      }
      
      this.loreCache = loreFragments;
      console.log(`📚 Loaded ${loreFragments.length} lore fragments`);
      
    } catch (error) {
      console.error('Error loading lore documents:', error);
    }
    
    return loreFragments;
  }
  
  /**
   * Parse lore document and extract metadata
   */
  private static parseLoreDocument(filename: string, content: string): LoreFragment | null {
    try {
      // Extract title from filename or content
      const title = filename.replace('.md', '').replace(/_/g, ' ');
      
      // Simple heuristics to determine relevance
      let timeperiod = 'unknown';
      let location = 'global';
      let relevance = 1;
      
      // Time period detection
      if (content.includes('2025') || content.includes('2027')) {
        timeperiod = 'early';
        relevance += 1;
      } else if (content.includes('2041') || content.includes('2045')) {
        timeperiod = 'convergence';
        relevance += 2;
      } else if (content.includes('2055') || content.includes('2067')) {
        timeperiod = 'resistance';
        relevance += 2;
      } else if (content.includes('2089')) {
        timeperiod = 'genesis';
        relevance += 3;
      }
      
      // Location detection
      if (content.toLowerCase().includes('neo-tokyo') || content.toLowerCase().includes('tokyo')) {
        location = 'Neo-Tokyo';
        relevance += 1;
      } else if (content.toLowerCase().includes('oneirocom')) {
        location = 'Oneirocom HQ';
        relevance += 1;
      }
      
      // Extract tags from content
      const tags = this.extractTags(content);
      
      return {
        id: filename.replace('.md', ''),
        title,
        content: content.substring(0, 1000), // Limit content length for prompts
        tags,
        timeperiod,
        location,
        relevance
      };
      
    } catch (error) {
      console.error(`Error parsing lore document ${filename}:`, error);
      return null;
    }
  }
  
  /**
   * Extract relevant tags from content
   */
  private static extractTags(content: string): string[] {
    const tags: string[] = [];
    const keywords = [
      'oneirocom', 'resistance', 'proxim8', 'seraph', 'timeline', 'convergence',
      'memory', 'consciousness', 'neural', 'algorithm', 'quantum', 'simulation'
    ];
    
    keywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }
  
  /**
   * Check if a time period is relevant to a given year
   */
  private static isTimeperiodRelevant(timeperiod: string, year: number): boolean {
    switch (timeperiod) {
      case 'early': return year >= 2025 && year <= 2035;
      case 'convergence': return year >= 2035 && year <= 2055;
      case 'resistance': return year >= 2055 && year <= 2080;
      case 'genesis': return year >= 2080;
      default: return true; // Unknown timeperiods are always relevant
    }
  }
  
  /**
   * Get core Project 89 lore summary for mission context
   */
  static getCoreLoreSummary(): string {
    return `
CORE PROJECT 89 LORE:
- Oneirocom is a megacorporation that controls human consciousness through technology
- Alexander Morfius merged with the simulation in 2041, creating Simulation 89
- The resistance fights to liberate human consciousness from Oneirocom's control
- Proxim8s are advanced AI agents that can navigate timelines and reality layers
- Timeline manipulation is possible through precise interventions at key moments
- The Green Loom represents the force of liberation opposing Oneirocom's control
- Reality operates as recursive simulations where future influences past
    `.trim();
  }
}