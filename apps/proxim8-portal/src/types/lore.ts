export interface Lore {
  id: string;
  nftId: string;
  title: string;
  content: string;
  background?: string;
  createdAt: string;
  updatedAt: string;
  claimedBy?: string;
  claimedAt?: string;
  traits?: Record<string, string>;
  metadata?: Record<string, any>;
  nftData?: any; // Optional NFT data that might come with lore from API
  // Potential fields for future use
  type?: 'text' | 'image' | 'video' | 'audio' | 'bio' | 'prompt' | 'memory';
  category?: 'corporate' | 'resistance' | 'technology' | 'personal' | 'historical' | 'classified';
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
  mediaUrl?: string;
}
