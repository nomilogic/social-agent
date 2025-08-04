import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Zap } from 'lucide-react';
import { CompanyInfo, PostContent, GeneratedPost, Platform } from '../types';
import { generateAllPosts } from '../lib/gemini';

interface AIGeneratorProps {
  companyInfo: CompanyInfo;
  contentData: PostContent;
  onComplete: (posts: GeneratedPost[]) => void;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({
  companyInfo,
  contentData,
  onComplete,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState<Platform | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    generatePosts();
  }, [companyInfo, contentData]);

  const generatePosts = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentPlatform(null);

    try {
      // Use selected platforms from content data instead of company platforms
      const targetPlatforms = contentData.selectedPlatforms || companyInfo.platforms;
      const modifiedCompanyInfo = { ...companyInfo, platforms: targetPlatforms };
      
      const posts = await generateAllPosts(
        modifiedCompanyInfo,
        contentData,
        (platform, progress) => {
          setCurrentPlatform(platform);
          setProgress(progress);
        }
      );

      setIsGenerating(false);
      setCurrentPlatform(null);
      onComplete(posts);
    } catch (error) {
      console.error('Error generating posts:', error);
      setIsGenerating(false);
      setCurrentPlatform(null);
      
      // Show error or fallback
      onComplete([]);
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      tiktok: '🎵',
      youtube: '🎬'
    };
    return icons[platform] || '📱';
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Brain className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI is Crafting Your Posts</h2>
        <p className="text-gray-600">Creating optimized content for each platform</p>
      </div>

      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Platform */}
        {currentPlatform && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-3xl animate-bounce">
                {getPlatformIcon(currentPlatform)}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Optimizing for {currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                  Analyzing audience, tone, and platform best practices...
                </p>
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Sparkles className="w-6 h-6 text-yellow-500 mb-2" />
            <h3 className="font-medium text-gray-900">Smart Optimization</h3>
            <p className="text-sm text-gray-600">Tailoring content for each platform's unique audience</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Zap className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">Hashtag Research</h3>
            <p className="text-sm text-gray-600">Finding trending and relevant hashtags</p>
          </div>
          <div className="bg-white border border-gray-200 p-4 rounded-lg">
            <Brain className="w-6 h-6 text-purple-500 mb-2" />
            <h3 className="font-medium text-gray-900">Tone Analysis</h3>
            <p className="text-sm text-gray-600">Matching your brand voice perfectly</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Processing {companyInfo.platforms.length} platform{companyInfo.platforms.length > 1 ? 's' : ''}...</p>
        </div>
      </div>
    </div>
  );
};