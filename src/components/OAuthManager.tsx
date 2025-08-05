
import React, { useState, useEffect } from 'react';
import { Check, ExternalLink, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { oauthManager } from '../lib/oauth';
import { Platform } from '../types';

interface OAuthManagerProps {
  userId: string;
  platforms: Platform[];
  onCredentialsUpdate?: () => void;
}

interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  loading: boolean;
  error?: string;
}

export const OAuthManager: React.FC<OAuthManagerProps> = ({
  userId,
  platforms,
  onCredentialsUpdate
}) => {
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPlatformStatuses();
  }, [userId, platforms]);

  const checkPlatformStatuses = async () => {
    setLoading(true);
    const statuses: PlatformStatus[] = [];

    for (const platform of platforms) {
      try {
        const connected = await oauthManager.hasValidCredentials(userId, platform);
        statuses.push({
          platform,
          connected,
          loading: false
        });
      } catch (error) {
        statuses.push({
          platform,
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setPlatformStatuses(statuses);
    setLoading(false);
  };

  const handleConnect = async (platform: Platform) => {
    try {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, loading: true, error: undefined }
            : status
        )
      );

      const authUrl = oauthManager.generateAuthUrl(platform, userId);
      
      // Open OAuth flow in new window
      const authWindow = window.open(
        authUrl,
        `${platform}_oauth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for completion
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          // Recheck status after OAuth flow
          setTimeout(checkPlatformStatuses, 1000);
        }
      }, 1000);

    } catch (error) {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { 
                ...status, 
                loading: false, 
                error: error instanceof Error ? error.message : 'Connection failed' 
              }
            : status
        )
      );
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      await oauthManager.revokeCredentials(userId, platform);
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, connected: false, error: undefined }
            : status
        )
      );
      onCredentialsUpdate?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleRefresh = async (platform: Platform) => {
    try {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, loading: true, error: undefined }
            : status
        )
      );

      const credentials = await oauthManager.getCredentials(userId, platform);
      if (credentials) {
        await oauthManager.refreshToken(userId, platform, credentials);
      }
      
      await checkPlatformStatuses();
      onCredentialsUpdate?.();
    } catch (error) {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { 
                ...status, 
                loading: false, 
                error: error instanceof Error ? error.message : 'Refresh failed' 
              }
            : status
        )
      );
    }
  };

  const getPlatformDisplayName = (platform: Platform): string => {
    const names: Record<Platform, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter/X',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      youtube: 'YouTube'
    };
    return names[platform];
  };

  const getPlatformColor = (platform: Platform): string => {
    const colors: Record<Platform, string> = {
      facebook: 'blue',
      instagram: 'pink',
      twitter: 'blue',
      linkedin: 'blue',
      tiktok: 'black',
      youtube: 'red'
    };
    return colors[platform];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Connections</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Checking connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Connections</h3>
      <p className="text-sm text-gray-600 mb-6">
        Connect your social media accounts to enable direct publishing.
      </p>

      <div className="space-y-4">
        {platformStatuses.map((status) => (
          <div
            key={status.platform}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm bg-${getPlatformColor(status.platform)}-600`}
              >
                {status.platform.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {getPlatformDisplayName(status.platform)}
                </h4>
                <div className="flex items-center space-x-2">
                  {status.connected ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Connected
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not connected</span>
                  )}
                  {status.error && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {status.error}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {status.connected ? (
                <>
                  <button
                    onClick={() => handleRefresh(status.platform)}
                    disabled={status.loading}
                    className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                    title="Refresh token"
                  >
                    <RefreshCw className={`w-4 h-4 ${status.loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleDisconnect(status.platform)}
                    disabled={status.loading}
                    className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(status.platform)}
                  disabled={status.loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ExternalLink className="w-4 h-4" />
                  )}
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">OAuth Setup Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              To enable OAuth authentication, you need to:
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>Create developer apps for each platform</li>
              <li>Configure OAuth redirect URIs</li>
              <li>Add client IDs and secrets to environment variables</li>
              <li>Set up the OAuth callback handlers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
