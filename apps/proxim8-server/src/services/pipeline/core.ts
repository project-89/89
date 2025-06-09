// Define the context interface - this is what gets passed through the pipeline
export interface PipelineContext {
  nftId?: string;
  walletAddress?: string;
  prompt?: string;
  style?: string;
  imageUrl?: string;
  videoUrl?: string;
  status?: string;
  error?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

// Helper function to create a new context
export function createContext(
  initialData: Partial<PipelineContext> = {}
): PipelineContext {
  return {
    ...initialData,
    metadata: initialData.metadata || {},
    get(key: string): any {
      return this[key];
    },
    set(key: string, value: any): void {
      this[key] = value;
    },
    getMetadata(key: string): any {
      return this.metadata?.[key];
    },
    setMetadata(key: string, value: any): void {
      if (!this.metadata) this.metadata = {};
      this.metadata[key] = value;
    },
  };
}

// Define the middleware interface
export interface Middleware {
  name: string;
  execute: (context: PipelineContext) => Promise<PipelineContext>;
}

// Pipeline builder for creating pipelines
export class PipelineBuilder {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): PipelineBuilder {
    this.middlewares.push(middleware);
    return this;
  }

  build(): Pipeline {
    return new Pipeline([...this.middlewares]);
  }
}

// Pipeline class for executing middleware
export class Pipeline {
  constructor(private middlewares: Middleware[]) {}

  async execute(initialContext: PipelineContext): Promise<PipelineContext> {
    let context = { ...initialContext };

    for (const middleware of this.middlewares) {
      try {
        console.log(`Executing middleware: ${middleware.name}`);
        context = await middleware.execute(context);

        // Enhanced error checking - check multiple possible error indicators
        if (this.hasError(context)) {
          // Get the error message from wherever it's stored
          const errorMessage = this.getErrorMessage(context);
          console.error(
            `Middleware ${middleware.name} failed with error:`,
            errorMessage
          );
          console.error(
            "Context state at failure:",
            JSON.stringify(context, null, 2)
          );

          // Return immediately with error status
          return {
            ...context,
            status: "error",
            error: errorMessage,
          };
        }
      } catch (error) {
        console.error(`Middleware ${middleware.name} threw an error:`, error);
        console.error(
          "Context state at failure:",
          JSON.stringify(context, null, 2)
        );
        return {
          ...context,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
    return context;
  }

  // Helper method to check if the context has any type of error
  private hasError(context: PipelineContext): boolean {
    return (
      !!context.error ||
      !!context.getMetadata?.("globalError") ||
      !!context.getMetadata?.("imageGenerationError") ||
      !!context.getMetadata?.("videoGenerationError") ||
      !!context.getMetadata?.("promptEnhancementError") ||
      !!context.getMetadata?.("nftExtractionError") ||
      !!context.metadata?.hasErrors === true
    );
  }

  // Helper method to get the error message from context
  private getErrorMessage(context: PipelineContext): string {
    return (
      context.error ||
      context.getMetadata?.("globalError") ||
      context.getMetadata?.("imageGenerationError") ||
      context.getMetadata?.("videoGenerationError") ||
      context.getMetadata?.("promptEnhancementError") ||
      context.getMetadata?.("nftExtractionError") ||
      "Unknown error occurred"
    );
  }

  getMiddlewares(): Middleware[] {
    return [...this.middlewares];
  }
}
