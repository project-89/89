export interface VideoGenerationRequest {
  nftId: string;
  walletAddress: string;
  prompt: string;
  style?: string;
}

export interface VideoGenerationResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
