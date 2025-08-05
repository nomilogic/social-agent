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
  const url = 'https://api.twitter.com/2/tweets';
  
  const tweetText = `${params.post.caption}\n\n${params.post.hashtags.join(' ')}`;
  
  const data: any = {
    text: tweetText.slice(0, 280) // Twitter character limit
  };
  
  // Add media if image URL is provided
  if (params.post.imageUrl) {
    // First upload media
    const mediaId = await uploadTwitterMedia(params.accessToken, params.post.imageUrl);
    if (mediaId) {
      data.media = { media_ids: [mediaId] };
    }
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new SocialPosterError(
      `Twitter post failed: ${error.detail || error.title || 'Unknown error'}`,
      'twitter',
      response.status,
      response.status >= 500
    );
  }
  
  return response.json();
}

// TikTok
export async function postToTikTok(params: { accessToken: string; post: GeneratedPost }) {
  if (!params.post.imageUrl) {
    throw new SocialPosterError('TikTok requires a video file', 'tiktok', 400, false);
  }
  
  const url = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
  
  const data = {
    post_info: {
      title: params.post.caption.slice(0, 150), // TikTok title limit
      privacy_level: 'MUTUAL_FOLLOW_FRIENDS', // or 'PUBLIC_TO_EVERYONE'
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000
    },
    source_info: {
      source: 'FILE_UPLOAD',
      video_size: 50000000, // Max 50MB
      chunk_size: 10000000,  // 10MB chunks
      total_chunk_count: 1
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new SocialPosterError(
      `TikTok post failed: ${error.error?.message || 'Unknown error'}`,
      'tiktok',
      response.status,
      response.status >= 500
    );
  }
  
  const result = await response.json();
  
  // Upload video file using the upload URL
  if (result.data?.upload_url) {
    await uploadTikTokVideo(result.data.upload_url, params.post.imageUrl);
  }
  
  return result;
}

// YouTube
export async function postToYouTube(params: { accessToken: string; post: GeneratedPost; videoPath: string }) {
  if (!params.videoPath) {
    throw new SocialPosterError('YouTube requires a video file', 'youtube', 400, false);
  }
  
  // Step 1: Upload video metadata
  const metadataUrl = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';
  
  const metadata = {
    snippet: {
      title: params.post.caption.slice(0, 100),
      description: `${params.post.caption}\n\n${params.post.hashtags.join(' ')}`,
      tags: params.post.hashtags.map(tag => tag.replace('#', '')),
      categoryId: '22', // People & Blogs category
      defaultLanguage: 'en',
      defaultAudioLanguage: 'en'
    },
    status: {
      privacyStatus: 'public', // or 'private', 'unlisted'
      selfDeclaredMadeForKids: false
    }
  };
  
  const metadataResponse = await fetch(metadataUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': 'video/*'
    },
    body: JSON.stringify(metadata)
  });
  
  if (!metadataResponse.ok) {
    const error = await metadataResponse.json();
    throw new SocialPosterError(
      `YouTube upload failed: ${error.error?.message || 'Unknown error'}`,
      'youtube',
      metadataResponse.status,
      metadataResponse.status >= 500
    );
  }
  
  const uploadUrl = metadataResponse.headers.get('Location');
  if (!uploadUrl) {
    throw new SocialPosterError('Failed to get YouTube upload URL', 'youtube', 500, true);
  }
  
  // Step 2: Upload video file
  const videoResponse = await fetch(params.videoPath);
  const videoBlob = await videoResponse.blob();
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${params.accessToken}`,
      'Content-Type': 'video/*'
    },
    body: videoBlob
  });
  
  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new SocialPosterError(
      `YouTube video upload failed: ${error.error?.message || 'Unknown error'}`,
      'youtube',
      uploadResponse.status,
      uploadResponse.status >= 500
    );
  }
  
  return uploadResponse.json();
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
            // For YouTube, we need a video file, not just an image
            if (!post.imageUrl) {
              throw new SocialPosterError('YouTube requires a video file', 'youtube', 400, false);
            }
            return await postToYouTube({ 
              accessToken: credentials.accessToken, 
              post, 
              videoPath: post.imageUrl 
            });
            
          default:
            throw new SocialPosterError(`Unsupported platform: ${platform}`, platform);
        }
      }, platform);
      
      results[platform] = {
        success: true,
        message: `Successfully posted to ${platform}!`,
        postId: getPostIdFromResult(result, platform),
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

// Helper function to upload media to Twitter
async function uploadTwitterMedia(accessToken: string, imageUrl: string): Promise<string | null> {
  try {
    // Download image
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    
    // Upload to Twitter
    const uploadResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        media_data: base64Image
      })
    });
    
    if (uploadResponse.ok) {
      const result = await uploadResponse.json();
      return result.media_id_string;
    }
  } catch (error) {
    console.error('Failed to upload Twitter media:', error);
  }
  return null;
}

// Helper function to upload video to TikTok
async function uploadTikTokVideo(uploadUrl: string, videoUrl: string): Promise<void> {
  const videoResponse = await fetch(videoUrl);
  const videoBlob = await videoResponse.blob();
  
  await fetch(uploadUrl, {
    method: 'PUT',
    body: videoBlob,
    headers: {
      'Content-Type': 'video/mp4'
    }
  });
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

// Helper function to extract post ID from API response
function getPostIdFromResult(result: any, platform: string): string {
  switch (platform) {
    case 'facebook':
      return result.data?.id || result.id || 'Unknown';
    case 'instagram':
      return result.data?.id || result.id || 'Unknown';
    case 'linkedin':
      return result.data?.id || result.id || 'Unknown';
    case 'twitter':
      return result.data?.id || result.id || 'Unknown';
    case 'tiktok':
      return result.data?.publish_id || 'Unknown';
    case 'youtube':
      return result.id || 'Unknown';
    default:
      return 'Unknown';
  }
}
