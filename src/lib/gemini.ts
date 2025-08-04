import { GoogleGenerativeAI } from '@google/generative-ai';
import { Platform, CompanyInfo, PostContent, GeneratedPost } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key. Please check your .env file.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface PlatformConfig {
  maxLength: number;
  hashtagCount: number;
  tone: string;
  features: string[];
}

export const platformConfigs: Record<Platform, PlatformConfig> = {
  facebook: {
    maxLength: 2000,
    hashtagCount: 3,
    tone: 'conversational',
    features: ['link preview', 'reactions', 'community engagement']
  },
  instagram: {
    maxLength: 2200,
    hashtagCount: 10,
    tone: 'visual-first',
    features: ['hashtags', 'emojis', 'stories', 'visual appeal']
  },
  twitter: {
    maxLength: 280,
    hashtagCount: 2,
    tone: 'concise',
    features: ['trending', 'mentions', 'brevity', 'real-time']
  },
  linkedin: {
    maxLength: 3000,
    hashtagCount: 5,
    tone: 'professional',
    features: ['industry insights', 'networking', 'thought leadership']
  },
  tiktok: {
    maxLength: 300,
    hashtagCount: 8,
    tone: 'trendy',
    features: ['viral', 'sounds', 'challenges', 'youth appeal']
  },
  youtube: {
    maxLength: 5000,
    hashtagCount: 3,
    tone: 'educational',
    features: ['description', 'timestamps', 'SEO optimization']
  }
};

export async function analyzeImage(imageFile: File): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    // Convert file to base64
    const imageData = await fileToGenerativePart(imageFile);
    
    const prompt = `
Analyze this image and provide a detailed description that would be useful for social media content creation. Include:
1. What's in the image (objects, people, setting)
2. The mood/atmosphere
3. Colors and visual elements
4. Potential marketing angles or messages
5. Suggested content themes

Keep the description concise but informative for social media marketing purposes.
`;

    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error analyzing image:', error);
    return 'Unable to analyze image. Please add a description manually.';
  }
}

async function fileToGenerativePart(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.readAsDataURL(file);
  });
}

export async function generatePostForPlatform(
  platform: Platform,
  companyInfo: CompanyInfo,
  contentData: PostContent
): Promise<{
  caption: string;
  hashtags: string[];
  emojis: string;
  characterCount: number;
  engagement: 'high' | 'medium' | 'low';
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const config = platformConfigs[platform];

  const prompt = `
You are an expert social media content creator. Generate a ${platform} post with the following requirements:

COMPANY INFORMATION:
- Company: ${companyInfo.name}
- Industry: ${companyInfo.industry || 'General'}
- Target Audience: ${companyInfo.targetAudience || 'General audience'}
- Brand Tone: ${companyInfo.brandTone}
- Goals: ${companyInfo.goals.join(', ')}

CONTENT DETAILS:
- Main Message: ${contentData.prompt}
- Keywords/Tags: ${contentData.tags.join(', ')}
- Campaign ID: ${contentData.campaignId || 'N/A'}

PLATFORM REQUIREMENTS FOR ${platform.toUpperCase()}:
- Maximum length: ${config.maxLength} characters
- Tone: ${config.tone}
- Key features: ${config.features.join(', ')}
- Hashtag count: ${config.hashtagCount}

INSTRUCTIONS:
1. Create an engaging caption that matches the brand tone and platform style
2. Keep within the character limit (${config.maxLength} characters)
3. Generate exactly ${config.hashtagCount} relevant hashtags
4. Include appropriate emojis for the platform
5. Make it optimized for ${platform} audience engagement

Please respond in this exact JSON format:
{
  "caption": "Your generated caption here",
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "emojis": "🎉 ✨ 🚀",
  "engagement_prediction": "high"
}

Make sure the JSON is valid and properly formatted.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to extract JSON from the response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const jsonResponse = JSON.parse(jsonMatch[0]);
    
    return {
      caption: jsonResponse.caption || contentData.prompt,
      hashtags: jsonResponse.hashtags || [`#${companyInfo.name.replace(/\s+/g, '').toLowerCase()}`],
      emojis: jsonResponse.emojis || '✨',
      characterCount: jsonResponse.caption?.length || 0,
      engagement: jsonResponse.engagement_prediction || 'medium'
    };
  } catch (error) {
    console.error('Error generating content with Gemini:', error);
    
    // Fallback content generation
    return generateFallbackContent(platform, companyInfo, contentData, config);
  }
}

function generateFallbackContent(
  platform: Platform,
  companyInfo: CompanyInfo,
  contentData: PostContent,
  config: PlatformConfig
) {
  const platformStyles = {
    facebook: `🌟 ${contentData.prompt}\n\nWhat do you think? Share your thoughts in the comments!`,
    instagram: `✨ ${contentData.prompt}\n\nSwipe to see more! 👉`,
    twitter: `🚀 ${contentData.prompt}\n\nWhat's your take?`,
    linkedin: `🔍 ${contentData.prompt}\n\nI'd love to hear your professional insights on this. What has been your experience?`,
    tiktok: `🎵 ${contentData.prompt}\n\nWho else relates? 🙋‍♀️`,
    youtube: `🎬 ${contentData.prompt}\n\nDon't forget to like and subscribe for more content like this!`
  };

  let caption = platformStyles[platform] || contentData.prompt;
  
  // Truncate if too long
  if (caption.length > config.maxLength) {
    caption = caption.substring(0, config.maxLength - 3) + '...';
  }

  const baseTags = contentData.tags.map(tag => `#${tag.toLowerCase().replace(/\s+/g, '')}`);
  const platformTags = {
    facebook: ['#socialmedia', '#business', '#marketing'],
    instagram: ['#instagood', '#photooftheday', '#beautiful'],
    twitter: ['#trending', '#business'],
    linkedin: ['#professional', '#business'],
    tiktok: ['#fyp', '#viral'],
    youtube: ['#youtube', '#subscribe']
  };

  const hashtags = [...baseTags, ...(platformTags[platform] || [])].slice(0, config.hashtagCount);

  return {
    caption,
    hashtags,
    emojis: '✨ 🚀 💫',
    characterCount: caption.length,
    engagement: 'medium' as const
  };
}

export async function generateAllPosts(
  companyInfo: CompanyInfo,
  contentData: PostContent,
  onProgress?: (platform: Platform, progress: number) => void
) {
  const posts = [];
  const totalPlatforms = companyInfo.platforms.length;

  for (let i = 0; i < totalPlatforms; i++) {
    const platform = companyInfo.platforms[i];
    
    if (onProgress) {
      onProgress(platform, ((i + 1) / totalPlatforms) * 100);
    }

    const post = await generatePostForPlatform(platform, companyInfo, contentData);
    posts.push({
      platform,
      ...post
    });
  }

  return posts;
}