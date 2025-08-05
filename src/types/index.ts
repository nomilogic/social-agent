export interface CompanyInfo {
  name: string;
  website: string;
  industry: string;
  targetAudience: string;
  brandTone: 'professional' | 'playful' | 'motivational' | 'casual' | 'authoritative';
  goals: string[];
  platforms: Platform[];
}

export interface PostContent {
  prompt: string;
  media?: File;
  mediaUrl?: string;
  tags: string[];
  campaignId?: string;
  selectedPlatforms?: Platform[];
}

export interface GeneratedPost {
  platform: Platform;
  caption: string;
  hashtags: string[];
  emojis: string;
  characterCount: number;
  engagement: 'high' | 'medium' | 'low';
  imageUrl?: string;
}

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube';

export interface StepData {
  company?: CompanyInfo;
  content?: PostContent;
  generatedPosts?: GeneratedPost[];
}