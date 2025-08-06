
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { oauthManager } from '../lib/oauth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    handleOAuthCallback();
  }, [searchParams]);
//http://localhost:5173/oauth/linkedin/callback?code=AQR8eIGL5JHXD40jx6RvFjp_kSUY6sxso4nHl300-Fw3fIiu39dIscZYAaInRsmLPvJI2xqVAXkdI9bN8K3lUm7954PTkwxaMdAlB9rFfaGV60qQ05kx4_Uhr0i7kNWUbIujrNHGpqSQXTHOgHfCBDGtp-KnQlw3IjyFEkwktIBpU74Sw1S1dGp6L9JjCivw1Zwk5AjoYqQxVAuvLc8&state=linkedin_undefined_9738bb92a647c413dc6378df761054c3
    const handleOAuthCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing required OAuth parameters');
      }

      console.log(`OAuth code received: ${code}`);
      const platform = state.split('_')[0];

      if (!platform) {
        throw new Error('Invalid state parameter');
      }

      console.log(`Handling OAuth callback for platform: ${platform}`);
      await oauthManager.handleCallback(platform, code, state);

      setStatus('success');
      setMessage(`Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);

      // Close window after a short delay
      setTimeout(() => {
        window.close();
      }, 122000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'OAuth authentication failed');

      setTimeout(() => {
        window.close();
      }, 30000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Authentication...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your credentials.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-3">
              This window will close automatically.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-3">
              This window will close automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
