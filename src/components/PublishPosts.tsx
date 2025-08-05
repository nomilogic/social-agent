import React, { useState } from 'react';
import { GeneratedPost, Platform } from '../types';
import { postToAllPlatforms } from '../lib/socialPoster';

interface PublishProps {
  posts: GeneratedPost[];
  onBack: () => void;
}

export const PublishPosts: React.FC<PublishProps> = ({ posts, onBack }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(posts.map(p => p.platform));
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo credentials - in production, these would come from user OAuth
  const [credentials, setCredentials] = useState({
    facebook: { pageId: '', accessToken: '' },
    instagram: { businessAccountId: '', accessToken: '' },
    linkedin: { organizationId: '', accessToken: '' },
    twitter: { accessToken: '' },
    tiktok: { accessToken: '' },
    youtube: { accessToken: '', videoPath: '' }
  });

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    
    // Simulate publishing delay for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Demo mode - simulate successful publishing
      const publishResults: Record<string, any> = {};
      for (const post of posts) {
        if (selectedPlatforms.includes(post.platform)) {
          publishResults[post.platform] = {
            success: true,
            message: `Demo: Successfully published to ${post.platform}`,
            postId: `demo_${post.platform}_${Date.now()}`,
            timestamp: new Date().toISOString()
          };
        }
      }
      setResults(publishResults);
    } catch (err: any) {
      setError(err.message || 'Failed to publish posts.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Publish Your Posts</h2>
      <p className="mb-6 text-gray-600">Select platforms and publish your AI-generated posts directly.</p>
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Select Platforms:</h3>
        <div className="flex gap-4 flex-wrap">
          {posts.map(post => (
            <label key={post.platform} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(post.platform)}
                onChange={e => {
                  setSelectedPlatforms(prev =>
                    e.target.checked
                      ? [...prev, post.platform]
                      : prev.filter(p => p !== post.platform)
                  );
                }}
              />
              <span className="capitalize font-medium">{post.platform}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Demo Credentials Notice */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">Demo Mode</h3>
        <p className="text-yellow-700 text-sm">
          This is a demonstration. In production, you would need to:
        </p>
        <ul className="text-yellow-700 text-sm mt-2 list-disc list-inside">
          <li>Set up OAuth authentication for each platform</li>
          <li>Store user access tokens securely</li>
          <li>Handle token refresh and error cases</li>
          <li>Comply with each platform's API terms of service</li>
        </ul>
      </div>
      <button
        className={`py-3 px-6 rounded-lg font-medium shadow transition-all duration-200 ${
          selectedPlatforms.length === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : publishing
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
        }`}
        onClick={handlePublish}
        disabled={publishing || selectedPlatforms.length === 0}
      >
        {publishing ? 'Publishing...' : `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length === 1 ? '' : 's'}`}
      </button>
      
      {selectedPlatforms.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">Please select at least one platform to publish.</p>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-green-700">✅ Publishing Results:</h3>
          <div className="space-y-3">
            {Object.entries(results).map(([platform, result]: [string, any]) => (
              <div key={platform} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 capitalize">{platform}</h4>
                <p className="text-green-600 text-sm">{result.message}</p>
                <p className="text-green-500 text-xs">Post ID: {result.postId}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        className="mt-8 w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
        onClick={onBack}
      >
        Back to Preview
      </button>
    </div>
  );
};
