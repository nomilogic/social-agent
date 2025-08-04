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

// Utility: Post to all platforms
export async function postToAllPlatforms(params: {
  facebook?: { pageId: string; accessToken: string };
  instagram?: { businessAccountId: string; accessToken: string };
  linkedin?: { organizationId: string; accessToken: string };
  twitter?: { accessToken: string };
  tiktok?: { accessToken: string };
  youtube?: { accessToken: string; videoPath: string };
  post: GeneratedPost;
}) {
  const results: Record<string, any> = {};
  const { facebook, instagram, linkedin, twitter, tiktok, youtube, post } = params;
  if (facebook) {
    results.facebook = await postToFacebook(facebook.pageId, facebook.accessToken, post);
  }
  if (instagram) {
    results.instagram = await postToInstagram(instagram.businessAccountId, instagram.accessToken, post);
  }
  if (linkedin) {
    results.linkedin = await postToLinkedIn(linkedin.organizationId, linkedin.accessToken, post);
  }
  if (twitter) {
    results.twitter = await postToTwitter({ accessToken: twitter.accessToken, post });
  }
  if (tiktok) {
    results.tiktok = await postToTikTok({ accessToken: tiktok.accessToken, post });
  }
  if (youtube) {
    results.youtube = await postToYouTube({ accessToken: youtube.accessToken, post, videoPath: youtube.videoPath });
  }
  return results;
}
