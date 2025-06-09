export interface NFTFile {
  uri: string;
}

export interface NFTProperties {
  files: NFTFile[];
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
  properties: NFTProperties;
  mint: string;
  id: string;
  collection: string;
  owner: string;
}
