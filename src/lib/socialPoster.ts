import axios from 'axios';
import { GeneratedPost, Platform } from '../types';

// Facebook
export async function postToFacebook(pageId: string, accessToken: string, post: GeneratedPost) {
  const url = `https://graph.facebook.com/${pageId}/feed`;
  const data: any = {
    message: `${post.caption}\n${post.hashtags.join(' ')}`,
    access_token: accessToken
  };
  if (post.imageUrl) data.picture = post.imageUrl;
  return axios.post(url, data);
}

// Instagram
export async function postToInstagram(businessAccountId: string, accessToken: string, post: GeneratedPost) {
  if (!post.imageUrl) throw new Error('Instagram post requires imageUrl');
  // Step 1: Create media object
  const mediaRes = await axios.post(
    `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
    { image_url: post.imageUrl, caption: post.caption, access_token: accessToken }
  );
  // Step 2: Publish media
  return axios.post(
    `https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`,
    { creation_id: mediaRes.data.id, access_token: accessToken }
  );
}

// LinkedIn
export async function postToLinkedIn(organizationId: string, accessToken: string, post: GeneratedPost) {
  const url = 'https://api.linkedin.com/v2/ugcPosts';
  const data = {
    author: `urn:li:organization:${organizationId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.caption },
        shareMediaCategory: post.imageUrl ? 'IMAGE' : 'NONE',
        media: post.imageUrl ? [{ status: 'READY', originalUrl: post.imageUrl }] : []
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };
  return axios.post(url, data, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

// Placeholder for Twitter, TikTok, YouTube
// Twitter/X
export async function postToTwitter(params: { accessToken: string; post: GeneratedPost }) {
  // Twitter API v2 requires OAuth 2.0 and elevated access
  // You must implement OAuth 2.0 flow and pass a valid accessToken
  // Example endpoint: POST https://api.twitter.com/2/tweets
  // See: https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
  throw new Error('Twitter auto-post not implemented. See comments for integration.');
}

// TikTok
export async function postToTikTok(params: { accessToken: string; post: GeneratedPost }) {
  // TikTok Content Posting API requires OAuth 2.0 and app audit for public posts
  // Endpoint: POST /v2/post/publish/video/init/
  // See: https://developers.tiktok.com/doc/content-posting-api-overview/
  throw new Error('TikTok auto-post not implemented. See comments for integration.');
}

// YouTube
export async function postToYouTube(params: { accessToken: string; post: GeneratedPost; videoPath: string }) {
  // YouTube Data API v3 requires OAuth 2.0 and video upload
  // Use videos.insert endpoint with accessToken and video file
  // See: https://developers.google.com/youtube/v3/docs/videos/insert
  throw new Error('YouTube auto-post not implemented. See comments for integration.');
}

// Enhanced error handling with retry logic
export class SocialPosterError extends Error {
  constructor(
    message: string,
    public platform: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SocialPosterError';
  }
}

// Retry mechanism for failed posts
async function withRetry<T>(
  fn: () => Promise<T>,
  platform: string,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on authentication errors
      if (error instanceof SocialPosterError && !error.retryable) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw new SocialPosterError(
          `Failed after ${maxRetries} attempts: ${lastError.message}`,
          platform,
          undefined,
          false
        );
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError!;
}

// Utility: Post to all platforms with enhanced error handling
export async function postToAllPlatforms(
  userId: string,
  posts: GeneratedPost[],
  onProgress?: (platform: string, status: 'pending' | 'success' | 'error') => void
): Promise<Record<string, any>> {
  const { oauthManager } = await import('./oauth');
  const results: Record<string, any> = {};
  
  for (const post of posts) {
    const platform = post.platform;
    
    try {
      onProgress?.(platform, 'pending');
      
      // Get OAuth credentials
      const credentials = await oauthManager.getCredentials(userId, platform);
      if (!credentials) {
        throw new SocialPosterError(
          `No OAuth credentials found for ${platform}`,
          platform,
          401,
          false
        );
      }
      
      // Post with retry logic
      const result = await withRetry(async () => {
        switch (platform) {
          case 'facebook':
            const fbPageId = await getFacebookPageId(credentials.accessToken);
            return await postToFacebook(fbPageId, credentials.accessToken, post);
            
          case 'instagram':
            const igAccountId = await getInstagramBusinessAccountId(credentials.accessToken);
            return await postToInstagram(igAccountId, credentials.accessToken, post);
            
          case 'linkedin':
            const linkedinOrgId = await getLinkedInOrganizationId(credentials.accessToken);
            return await postToLinkedIn(linkedinOrgId, credentials.accessToken, post);
            
          case 'twitter':
            return await postToTwitter({ accessToken: credentials.accessToken, post });
            
          case 'tiktok':
            return await postToTikTok({ accessToken: credentials.accessToken, post });
            
          case 'youtube':
            return await postToYouTube({ 
              accessToken: credentials.accessToken, 
              post, 
              videoPath: post.imageUrl || '' 
            });
            
          default:
            throw new SocialPosterError(`Unsupported platform: ${platform}`, platform);
        }
      }, platform);
      
      results[platform] = {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
      
      onProgress?.(platform, 'success');
      
    } catch (error) {
      console.error(`Failed to post to ${platform}:`, error);
      
      results[platform] = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      onProgress?.(platform, 'error');
    }
  }
  
  return results;
}

// Helper functions to get platform-specific IDs
async function getFacebookPageId(accessToken: string): Promise<string> {
  const response = await fetch(`https://graph.facebook.com/me/accounts?access_token=${accessToken}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new SocialPosterError(`Failed to get Facebook page ID: ${data.error?.message}`, 'facebook', response.status, false);
  }
  
  if (!data.data || data.data.length === 0) {
    throw new SocialPosterError('No Facebook pages found', 'facebook', 404, false);
  }
  
  return data.data[0].id; // Use first page
}

async function getInstagramBusinessAccountId(accessToken: string): Promise<string> {
  const pageId = await getFacebookPageId(accessToken);
  const response = await fetch(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new SocialPosterError(`Failed to get Instagram account ID: ${data.error?.message}`, 'instagram', response.status, false);
  }
  
  if (!data.instagram_business_account) {
    throw new SocialPosterError('No Instagram business account linked', 'instagram', 404, false);
  }
  
  return data.instagram_business_account.id;
}

async function getLinkedInOrganizationId(accessToken: string): Promise<string> {
  const response = await fetch('https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new SocialPosterError(`Failed to get LinkedIn organization ID: ${data.message}`, 'linkedin', response.status, false);
  }
  
  if (!data.elements || data.elements.length === 0) {
    throw new SocialPosterError('No LinkedIn organizations found', 'linkedin', 404, false);
  }
  
  return data.elements[0].organizationalTarget.split(':').pop(); // Extract ID from URN
}
