import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

interface PromptEnhancementInput {
  userPrompt: string;
  nftData?: {
    name?: string;
    description?: string;
    attributes?: Record<string, string>;
    image?: string;
  };
  loreData?: {
    title?: string;
    content?: string;
    background?: string;
    traits?: Record<string, string>;
  };
  style?: string;
  context?: string;
}

interface PromptEnhancementResult {
  originalPrompt: string;
  enhancedPrompt: string;
  promptId: string;
  systemPrompt?: string;
}

/**
 * Loads and processes lore files from the docs/lore directory
 * @returns A combined string of relevant lore information
 */
function loadLoreFromFiles(): string {
  try {
    const loreDir = path.join(process.cwd(), "docs", "lore");

    // Check if directory exists
    if (!fs.existsSync(loreDir)) {
      console.warn(`Lore directory not found: ${loreDir}`);
      return "";
    }

    // Get all markdown files
    const loreFiles = fs
      .readdirSync(loreDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(loreDir, file));

    if (loreFiles.length === 0) {
      console.warn("No lore files found in directory");
      return "";
    }

    console.log(`Found ${loreFiles.length} lore files`);

    // Process each file and extract key information
    let combinedLore = "";

    // Prioritize certain files that likely contain the most relevant information
    const priorityKeywords = [
      "proxim8",
      "character",
      "artifact",
      "worldbuilding",
    ];

    // Sort files to process priority files first
    loreFiles.sort((a, b) => {
      const aName = path.basename(a).toLowerCase();
      const bName = path.basename(b).toLowerCase();

      const aHasPriority = priorityKeywords.some((keyword) =>
        aName.includes(keyword)
      );
      const bHasPriority = priorityKeywords.some((keyword) =>
        bName.includes(keyword)
      );

      if (aHasPriority && !bHasPriority) return -1;
      if (!aHasPriority && bHasPriority) return 1;
      return 0;
    });

    // Process each file
    for (const file of loreFiles) {
      try {
        const content = fs.readFileSync(file, "utf8");

        // Extract just the key sections to keep memory usage reasonable
        const sections = content.split("\n## ");

        // Get file title
        const fileTitle = sections[0].split("\n")[0].replace("# ", "");

        // Add file info to combined lore
        combinedLore += `\n--- ${fileTitle} ---\n`;

        // Add important sections (limit to keep memory usage reasonable)
        for (let i = 1; i < Math.min(sections.length, 3); i++) {
          const sectionTitle = sections[i].split("\n")[0];
          const sectionContent = sections[i]
            .split("\n")
            .slice(1, 10)
            .join("\n");

          combinedLore += `\n${sectionTitle}:\n${sectionContent}\n`;
        }
      } catch (error) {
        console.error(`Error processing lore file ${file}:`, error);
      }
    }

    return combinedLore;
  } catch (error) {
    console.error("Error loading lore files:", error);
    return "";
  }
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string = "gemini-1.5-pro";
  private loreContent: string = "";

  constructor(apiKey: string, modelName?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName || this.modelName;
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });

    // Load lore content once during initialization
    this.loreContent = loadLoreFromFiles();
    console.log(`Loaded ${this.loreContent.length} characters of lore content`);
  }

  async enhancePrompt(
    input: PromptEnhancementInput
  ): Promise<PromptEnhancementResult> {
    try {
      const promptId = uuidv4();

      // Create system prompt for context
      const systemPrompt = `
        You are an expert prompt engineer for AI image and video generation.
        
        Your task is to create a high-quality, CONCISE prompt based on:
        - The user's request (most important)
        - The NFT character's key traits (personality, not appearance)
        - Relevant world lore and background
        
        IMPORTANT GUIDELINES:
        1. Focus on WHAT THE CHARACTER IS DOING in the scene, not their appearance
        2. Describe the ACTION, SCENE, and ENVIRONMENT the character is in
        3. The prompt will be used with GPT-Image-1 which already has the reference image
        4. Mention artistic style elements like lighting, mood, and composition
        5. Keep the total prompt UNDER 200 WORDS (this is critical)
        6. AVOID potentially problematic content:
           - No violence, gore, or explicit content
           - No political or controversial themes
           - No copyrighted characters or references
        
        Return ONLY the optimized prompt text with no additional commentary.
      `;

      // Assemble context data into a structured format for the AI
      const contextData = {
        userPrompt: input.userPrompt,
        nft: input.nftData || {},
        lore: input.loreData || {},
        style: input.style || "Realistic, detailed, cinematic lighting",
        additionalContext: input.context || "",
        worldLore: this.loreContent, // Add the loaded lore content
      };

      // Generate prompt enhancement
      const result = await this.model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nContext for prompt enhancement:\n${JSON.stringify(contextData, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });

      const response = result.response;
      const enhancedPrompt = response.text().trim();

      console.log(
        `Enhanced prompt for ${promptId}: ${enhancedPrompt.substring(0, 100)}...`
      );

      return {
        originalPrompt: input.userPrompt,
        enhancedPrompt,
        promptId,
        systemPrompt,
      };
    } catch (error) {
      console.error("Gemini prompt enhancement error:", error);
      throw new Error(
        `Prompt enhancement failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
