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

  // These would come from user OAuth/session in a real app
  const credentials = {
    facebook: { pageId: '', accessToken: '' },
    instagram: { businessAccountId: '', accessToken: '' },
    linkedin: { organizationId: '', accessToken: '' },
    twitter: { accessToken: '' },
    tiktok: { accessToken: '' },
    youtube: { accessToken: '', videoPath: '' }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    
    // Check if credentials are properly set
    const hasValidCredentials = selectedPlatforms.some(platform => {
      switch (platform) {
        case 'facebook':
          return credentials.facebook.pageId && credentials.facebook.accessToken;
        case 'instagram':
          return credentials.instagram.businessAccountId && credentials.instagram.accessToken;
        case 'linkedin':
          return credentials.linkedin.organizationId && credentials.linkedin.accessToken;
        case 'twitter':
        case 'tiktok':
        case 'youtube':
          return false; // These are not implemented yet
        default:
          return false;
      }
    });

    if (!hasValidCredentials) {
      setError('Publishing credentials are not configured. This is a demo - you need to add your actual social media API credentials.');
      setPublishing(false);
      return;
    }

    try {
      // Publish each post to its platform
      const publishResults: Record<string, any> = {};
      for (const post of posts) {
        if (selectedPlatforms.includes(post.platform)) {
          try {
            const params: any = { post };
            if (post.platform === 'facebook') Object.assign(params, { facebook: credentials.facebook });
            if (post.platform === 'instagram') Object.assign(params, { instagram: credentials.instagram });
            if (post.platform === 'linkedin') Object.assign(params, { linkedin: credentials.linkedin });
            if (post.platform === 'twitter') Object.assign(params, { twitter: credentials.twitter });
            if (post.platform === 'tiktok') Object.assign(params, { tiktok: credentials.tiktok });
            if (post.platform === 'youtube') Object.assign(params, { youtube: credentials.youtube });
            
            publishResults[post.platform] = await postToAllPlatforms(params);
          } catch (platformError: any) {
            publishResults[post.platform] = { error: platformError.message };
          }
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
        <h3 className="font-semibold mb-2">Platforms:</h3>
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
      <button
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        onClick={handlePublish}
        disabled={publishing}
      >
        {publishing ? 'Publishing...' : 'Publish Posts'}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {results && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Publish Results:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">{JSON.stringify(results, null, 2)}</pre>
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
