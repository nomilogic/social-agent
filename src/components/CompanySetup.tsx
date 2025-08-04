import React, { useState } from 'react';
import { Building2, Globe, Target, Palette, Goal } from 'lucide-react';
import { CompanyInfo } from '../types';

interface CompanySetupProps {
  onNext: (data: CompanyInfo) => void;
  onBack?: () => void;
  initialData?: Partial<CompanyInfo>;
}

export const CompanySetup: React.FC<CompanySetupProps> = ({ onNext, onBack, initialData }) => {
  const [formData, setFormData] = useState<CompanyInfo>({
    name: initialData?.name || '',
    website: initialData?.website || '',
    industry: initialData?.industry || '',
    targetAudience: initialData?.targetAudience || '',
    brandTone: initialData?.brandTone || 'professional',
    goals: initialData?.goals || [],
    platforms: initialData?.platforms || [],
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'E-commerce', 'Education', 'Food & Beverage',
    'Fashion', 'Real Estate', 'Automotive', 'Entertainment', 'Non-profit', 'Other'
  ];

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Formal and authoritative' },
    { value: 'playful', label: 'Playful', description: 'Fun and energetic' },
    { value: 'motivational', label: 'Motivational', description: 'Inspiring and uplifting' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and friendly' },
    { value: 'authoritative', label: 'Authoritative', description: 'Expert and trustworthy' },
  ];

  const goalOptions = [
    'Brand Awareness', 'Lead Generation', 'Customer Engagement', 'Sales Conversion',
    'Community Building', 'Thought Leadership', 'Product Launch', 'Event Promotion'
  ];

  const platformOptions = [
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600' },
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'twitter', name: 'Twitter/X', color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.platforms.length > 0) {
      onNext(formData);
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform as any)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform as any]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Setup</h2>
        <p className="text-gray-600">Tell us about your brand to create personalized content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Company Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your company name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select your industry</option>
            {industries.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Target className="w-4 h-4 inline mr-2" />
            Target Audience
          </label>
          <textarea
            value={formData.targetAudience}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            rows={3}
            placeholder="Describe your target audience (age, interests, demographics)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            <Palette className="w-4 h-4 inline mr-2" />
            Brand Tone
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toneOptions.map(tone => (
              <div
                key={tone.value}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  formData.brandTone === tone.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, brandTone: tone.value as any }))}
              >
                <h3 className="font-medium text-gray-900">{tone.label}</h3>
                <p className="text-sm text-gray-600 mt-1">{tone.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            <Goal className="w-4 h-4 inline mr-2" />
            Marketing Goals
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {goalOptions.map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  formData.goals.includes(goal)
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Target Platforms *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {platformOptions.map(platform => (
              <div
                key={platform.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  formData.platforms.includes(platform.id as any)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => togglePlatform(platform.id)}
              >
                <div className={`w-8 h-8 rounded-lg ${platform.color} mb-2`}></div>
                <h3 className="font-medium text-gray-900">{platform.name}</h3>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!formData.name || formData.platforms.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-8 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {initialData?.name ? 'Update Company' : 'Continue to Content Creation'}
          </button>
        </div>
      </form>
    </div>
  );
};