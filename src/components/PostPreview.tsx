import React, { useState } from 'react';
import { Copy, Download, Share2, Heart, MessageCircle, Repeat2, Eye, ThumbsUp, Send } from 'lucide-react';
import { GeneratedPost, Platform } from '../types';

interface PostPreviewProps {
  posts: GeneratedPost[];
  onBack: () => void;
  onRegenerate: () => void;
}

export const PostPreview: React.FC<PostPreviewProps> = ({ posts, onBack, onRegenerate }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(posts[0]?.platform || 'facebook');
  const [copiedPost, setCopiedPost] = useState<string | null>(null);

  const selectedPost = posts.find(post => post.platform === selectedPlatform);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPost(selectedPlatform);
      setTimeout(() => setCopiedPost(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getPlatformColors = (platform: Platform) => {
    const colors = {
      facebook: 'bg-blue-600 border-blue-200',
      instagram: 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-200',
      twitter: 'bg-black border-gray-200',
      linkedin: 'bg-blue-700 border-blue-200',
      tiktok: 'bg-black border-gray-200',
      youtube: 'bg-red-600 border-red-200'
    };
    return colors[platform] || 'bg-gray-600';
  };

  const renderPlatformPreview = (post: GeneratedPost) => {
    // ...existing code...
    const renderImage = () => post.imageUrl ? (
      <div className="w-full flex justify-center my-3">
        <img src={post.imageUrl} alt="Post media" className="rounded-lg max-h-80 object-contain" />
      </div>
    ) : null;
    switch (post.platform) {
      case 'facebook':
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  FB
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Your Company</h3>
                  <p className="text-xs text-gray-500">Just now · 🌍</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
              {renderImage()}
              <div className="mt-3 flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'instagram':
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-sm shadow-sm">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  IG
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">yourcompany</h3>
                </div>
              </div>
            </div>
            <div className="aspect-square bg-gray-100 flex items-center justify-center">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="Instagram media" className="object-cover w-full h-full" />
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2"></div>
                  <p className="text-sm">Your media here</p>
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <Heart className="w-6 h-6 text-gray-700" />
                  <MessageCircle className="w-6 h-6 text-gray-700" />
                  <Send className="w-6 h-6 text-gray-700" />
                </div>
              </div>
              <p className="text-sm">
                <span className="font-medium">yourcompany</span> {post.caption}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'twitter':
        return (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-lg shadow-sm">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-bold">
                  X
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-gray-900">Your Company</h3>
                    <span className="text-gray-500">@yourcompany</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-500">now</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{post.caption}</p>
                  {renderImage()}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.hashtags.map((tag, index) => (
                      <span key={index} className="text-blue-500 text-sm hover:underline cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 max-w-md">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">Reply</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500">
                      <Repeat2 className="w-4 h-4" />
                      <span className="text-sm">Repost</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-red-500">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'linkedin':
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                  LI
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Your Company</h3>
                  <p className="text-sm text-gray-500">Company • 1st</p>
                  <p className="text-xs text-gray-400">Just now</p>
                </div>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.caption}</p>
              {renderImage()}
              <div className="flex flex-wrap gap-1 mb-4">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'tiktok':
        return (
          <div className="bg-black rounded-lg overflow-hidden max-w-sm shadow-sm">
            <div className="aspect-[9/16] bg-gray-900 relative">
              {post.imageUrl && (
                <img src={post.imageUrl} alt="Tiktok media" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="text-white">
                  <p className="text-sm mb-2">{post.caption}</p>
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((tag, index) => (
                      <span key={index} className="text-blue-400 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'youtube':
        return (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-lg">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {post.imageUrl ? (
                <img src={post.imageUrl} alt="Youtube media" className="object-cover w-full h-full" />
              ) : (
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">▶</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{post.caption.split('\n')[0]}</h3>
              <p className="text-sm text-gray-600 mb-3">{post.caption}</p>
              <div className="flex flex-wrap gap-1">
                {post.hashtags.map((tag, index) => (
                  <span key={index} className="text-blue-600 text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-gray-900 mb-3 capitalize">{post.platform}</h3>
            <p className="text-gray-800 whitespace-pre-wrap mb-3">{post.caption}</p>
            <div className="flex flex-wrap gap-1">
              {post.hashtags.map((tag, index) => (
                <span key={index} className="text-blue-600 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
    }
  };

  const getFullPostText = (post: GeneratedPost) => {
    return `${post.caption}\n\n${post.hashtags.join(' ')}`;
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Eye className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your AI-Generated Posts</h2>
        <p className="text-gray-600">Review, copy, and share your optimized content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Platform Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Platform</h3>
          <div className="space-y-3">
            {posts.map((post) => (
              <button
                key={post.platform}
                onClick={() => setSelectedPlatform(post.platform)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedPlatform === post.platform
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">{post.platform}</h4>
                    <p className="text-sm text-gray-600">{post.characterCount} characters</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    post.engagement === 'high' ? 'bg-green-500' : 
                    post.engagement === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="mt-2">
                  <div className={`inline-block px-2 py-1 rounded text-xs text-white ${getPlatformColors(post.platform)}`}>
                    {post.engagement} engagement
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedPost && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => copyToClipboard(getFullPostText(selectedPost))}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  copiedPost === selectedPlatform
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>{copiedPost === selectedPlatform ? 'Copied!' : 'Copy Post'}</span>
              </button>

              <button
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([getFullPostText(selectedPost)], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `${selectedPost.platform}-post.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="flex justify-center mb-6">
            {selectedPost && renderPlatformPreview(selectedPost)}
          </div>

          {selectedPost && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Post Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Character Count:</span>
                  <span className="ml-2 font-medium">{selectedPost.characterCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Hashtags:</span>
                  <span className="ml-2 font-medium">{selectedPost.hashtags.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Engagement:</span>
                  <span className={`ml-2 font-medium capitalize ${
                    selectedPost.engagement === 'high' ? 'text-green-600' :
                    selectedPost.engagement === 'medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedPost.engagement}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Platform:</span>
                  <span className="ml-2 font-medium capitalize">{selectedPost.platform}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
        >
          Back to Edit
        </button>
        <button
          onClick={onRegenerate}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Regenerate Posts
        </button>
      </div>
      
      <div className="mt-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('showPublishModal', { detail: posts }))}
          className="w-full bg-green-600 text-white py-4 px-8 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Publish to Platforms
        </button>
      </div>
    </div>
  );
};