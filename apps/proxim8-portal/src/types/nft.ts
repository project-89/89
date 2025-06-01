export interface NFTFile {
  uri: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface GenerationConfig {
  model: string;
  run_timestamp: string;
}

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  attributes: NFTAttribute[];
  generation_config?: GenerationConfig;
  image: string;
  mint: string;
  id: string;
  collection: string;
  owner: string;
}

export interface NFT {
  id: string;
  name: string;
  description?: string;
  image?: string;
  mint?: string;
  owner?: string;
  creator?: string;
  collection?: string;
  attributes?: NFTAttribute[];
  metadata?: Record<string, any>;
}
