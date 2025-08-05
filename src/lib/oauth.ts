
import { supabase } from './supabase';

export interface OAuthCredentials {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
}

export interface PlatformOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

// Get the base URL for redirect URIs
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for server-side rendering or when window is not available
  return import.meta.env.VITE_APP_URL || 'https://workspace.replit.dev';
};

// OAuth configurations for each platform
export const oauthConfigs: Record<string, PlatformOAuthConfig> = {
  facebook: {
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_FACEBOOK_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/facebook/callback`,
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'publish_to_groups'],
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token'
  },
  instagram: {
    clientId: import.meta.env.VITE_INSTAGRAM_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/instagram/callback`,
    scopes: ['instagram_basic', 'instagram_content_publish'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token'
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_LINKEDIN_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/linkedin/callback`,
    scopes: ['w_member_social', 'r_liteprofile', 'r_emailaddress'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken'
  },
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_TWITTER_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/twitter/callback`,
    scopes: ['tweet.read', 'tweet.write', 'users.read'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token'
  },
  tiktok: {
    clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_TIKTOK_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/tiktok/callback`,
    scopes: ['user.info.basic', 'video.upload'],
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token'
  },
  youtube: {
    clientId: import.meta.env.VITE_YOUTUBE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET || '',
    redirectUri: `${getBaseUrl()}/oauth/youtube/callback`,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token'
  }
};

export class OAuthManager {
  private static instance: OAuthManager;
  private pendingAuths = new Map<string, string>();

  static getInstance(): OAuthManager {
    if (!OAuthManager.instance) {
      OAuthManager.instance = new OAuthManager();
    }
    return OAuthManager.instance;
  }

  // Generate OAuth URL for platform
  generateAuthUrl(platform: string, userId: string): string {
    const config = oauthConfigs[platform];
    if (!config) {
      throw new Error(`OAuth config not found for platform: ${platform}`);
    }

    const state = this.generateState(platform, userId);
    this.pendingAuths.set(state, userId);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state: state,
      access_type: 'offline', // For refresh tokens
      prompt: 'consent'
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(platform: string, code: string, state: string): Promise<OAuthCredentials> {
    const userId = this.pendingAuths.get(state);
    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    this.pendingAuths.delete(state);
    const config = oauthConfigs[platform];

    try {
      const tokenResponse = await this.exchangeCodeForToken(platform, code, config);
      const credentials = await this.processTokenResponse(tokenResponse, platform);
      
      // Store credentials securely
      await this.storeCredentials(userId, platform, credentials);
      
      return credentials;
    } catch (error) {
      console.error(`OAuth callback error for ${platform}:`, error);
      throw new Error(`Failed to complete OAuth for ${platform}`);
    }
  }

  // Exchange authorization code for access token
  private async exchangeCodeForToken(platform: string, code: string, config: PlatformOAuthConfig) {
    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri
    };

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  // Process token response based on platform
  private async processTokenResponse(response: any, platform: string): Promise<OAuthCredentials> {
    const credentials: OAuthCredentials = {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      tokenType: response.token_type || 'Bearer'
    };

    // Calculate expiration time
    if (response.expires_in) {
      credentials.expiresAt = Date.now() + (response.expires_in * 1000);
    }

    // Platform-specific processing
    switch (platform) {
      case 'facebook':
      case 'instagram':
        // Facebook tokens can be extended to long-lived tokens
        if (response.access_token) {
          const longLivedToken = await this.exchangeForLongLivedToken(platform, response.access_token);
          if (longLivedToken) {
            credentials.accessToken = longLivedToken.access_token;
            credentials.expiresAt = Date.now() + (longLivedToken.expires_in * 1000);
          }
        }
        break;
    }

    return credentials;
  }

  // Exchange short-lived token for long-lived token (Facebook/Instagram)
  private async exchangeForLongLivedToken(platform: string, shortToken: string) {
    const config = oauthConfigs[platform];
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      fb_exchange_token: shortToken
    });

    try {
      const response = await fetch(`${config.tokenUrl}?${params.toString()}`);
      return response.ok ? response.json() : null;
    } catch (error) {
      console.error('Failed to exchange for long-lived token:', error);
      return null;
    }
  }

  // Store credentials securely in Supabase
  private async storeCredentials(userId: string, platform: string, credentials: OAuthCredentials) {
    const { error } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: userId,
        platform: platform,
        access_token: credentials.accessToken,
        refresh_token: credentials.refreshToken,
        expires_at: credentials.expiresAt ? new Date(credentials.expiresAt).toISOString() : null,
        token_type: credentials.tokenType,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }
  }

  // Get stored credentials for user and platform
  async getCredentials(userId: string, platform: string): Promise<OAuthCredentials | null> {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !data) {
      return null;
    }

    const credentials: OAuthCredentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined
    };

    // Check if token needs refresh
    if (credentials.expiresAt && credentials.expiresAt < Date.now() + 300000) { // 5 minutes buffer
      const refreshedCredentials = await this.refreshToken(userId, platform, credentials);
      return refreshedCredentials || credentials;
    }

    return credentials;
  }

  // Refresh expired token
  async refreshToken(userId: string, platform: string, credentials: OAuthCredentials): Promise<OAuthCredentials | null> {
    if (!credentials.refreshToken) {
      return null;
    }

    const config = oauthConfigs[platform];
    const refreshData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: credentials.refreshToken,
      grant_type: 'refresh_token'
    };

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(refreshData)
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();
      const newCredentials = await this.processTokenResponse(tokenData, platform);
      
      // Preserve refresh token if not provided in response
      if (!newCredentials.refreshToken && credentials.refreshToken) {
        newCredentials.refreshToken = credentials.refreshToken;
      }

      await this.storeCredentials(userId, platform, newCredentials);
      return newCredentials;
    } catch (error) {
      console.error(`Failed to refresh token for ${platform}:`, error);
      return null;
    }
  }

  // Remove stored credentials
  async revokeCredentials(userId: string, platform: string): Promise<void> {
    const { error } = await supabase
      .from('oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      throw new Error(`Failed to revoke credentials: ${error.message}`);
    }
  }

  // Generate secure state parameter
  private generateState(platform: string, userId: string): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${platform}_${userId}_${randomString}`;
  }

  // Check if user has valid credentials for platform
  async hasValidCredentials(userId: string, platform: string): Promise<boolean> {
    const credentials = await this.getCredentials(userId, platform);
    return credentials !== null;
  }
}

export const oauthManager = OAuthManager.getInstance();
