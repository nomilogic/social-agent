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

export type Step = 'auth' | 'company' | 'content' | 'generate' | 'preview' | 'publish';

export interface PublishResult {
  success: boolean;
  message: string;
  postId?: string;
  timestamp: string;
  error?: string;
}

export interface PlatformCredentials {
  facebook?: { pageId: string; accessToken: string };
  instagram?: { businessAccountId: string; accessToken: string };
  linkedin?: { organizationId: string; accessToken: string };
  twitter?: { accessToken: string };
  tiktok?: { accessToken: string };
  youtube?: { accessToken: string; videoPath: string };
}