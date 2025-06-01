import { Middleware, PipelineContext } from "../core";
import { GeminiService } from "../../ai/gemini";
import { handleMiddlewareError } from "../utils";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini service
const geminiService = new GeminiService(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

/**
 * Middleware for enhancing user prompts using Gemini
 */
export const promptEnhancementMiddleware: Middleware = {
  name: "Prompt Enhancement",
  execute: async (context: PipelineContext): Promise<PipelineContext> => {
    try {
      // Extract relevant data from the context
      const userPrompt = context.get("userPrompt") as string;
      const nftData = context.get("nftData") as any;
      const loreData = context.get("loreData") as any;

      if (!userPrompt) {
        throw new Error("User prompt is required for prompt enhancement");
      }

      console.log(`Enhancing prompt: ${userPrompt.substring(0, 30)}...`);

      // Call Gemini service to enhance the prompt
      const enhancedPrompt = await geminiService.enhancePrompt({
        userPrompt,
        nftData,
        loreData,
        style: context.get("style") as string,
        context: context.get("additionalContext") as string,
      });

      // Store results in the context
      context.set("originalPrompt", userPrompt);
      context.set("enhancedPrompt", enhancedPrompt.enhancedPrompt);
      context.set("promptId", enhancedPrompt.promptId);

      // Add metadata
      context.setMetadata("promptEnhancementComplete", true);
      context.setMetadata("promptEnhancementTime", new Date());

      return context;
    } catch (error) {
      // Use standardized error handling
      context = handleMiddlewareError(context, error, "Prompt");

      // Continue with original prompt if enhancement fails
      if (!context.get("enhancedPrompt") && context.get("userPrompt")) {
        context.set("enhancedPrompt", context.get("userPrompt"));
      }

      return context;
    }
  },
};
