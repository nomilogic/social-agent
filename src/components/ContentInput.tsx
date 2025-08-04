import React, { useState, useRef } from 'react';
import { Upload, FileText, Tag, Camera, Wand2, Eye, Loader } from 'lucide-react';
import { PostContent, Platform } from '../types';
import { uploadMedia, getCurrentUser } from '../lib/database';
import { analyzeImage } from '../lib/gemini';

interface ContentInputProps {
  onNext: (data: PostContent) => void;
  onBack: () => void;
  initialData?: Partial<PostContent>;
  selectedPlatforms: Platform[];
}

export const ContentInput: React.FC<ContentInputProps> = ({ 
  onNext, 
  onBack, 
  initialData,
  selectedPlatforms 
}) => {
  const [formData, setFormData] = useState<PostContent>({
    prompt: initialData?.prompt || '',
    tags: initialData?.tags || [],
    campaignId: initialData?.campaignId || '',
    selectedPlatforms: initialData?.selectedPlatforms || selectedPlatforms,
  });
  const [dragActive, setDragActive] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setAnalyzingImage(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const mediaUrl = await uploadMedia(file, user.id);
      setFormData(prev => ({ ...prev, media: file, mediaUrl }));
      
      // Analyze image if it's an image file
      if (file.type.startsWith('image/')) {
        const analysis = await analyzeImage(file);
        setImageAnalysis(analysis);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Still set the file for preview, but without URL
      setFormData(prev => ({ ...prev, media: file }));
    } finally {
      setUploading(false);
      setAnalyzingImage(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.prompt.trim()) {
      onNext(formData);
    }
  };

  const platformOptions = [
    { id: 'facebook', name: 'Facebook', color: 'bg-blue-600', icon: '📘' },
    { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '📷' },
    { id: 'twitter', name: 'Twitter/X', color: 'bg-black', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' },
    { id: 'tiktok', name: 'TikTok', color: 'bg-black', icon: '🎵' },
    { id: 'youtube', name: 'YouTube', color: 'bg-red-600', icon: '🎬' },
  ];

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms?.includes(platform as Platform)
        ? prev.selectedPlatforms.filter(p => p !== platform)
        : [...(prev.selectedPlatforms || []), platform as Platform]
    }));
  };

  const useImageAnalysis = () => {
    setFormData(prev => ({
      ...prev,
      prompt: prev.prompt + (prev.prompt ? '\n\n' : '') + imageAnalysis
    }));
    setImageAnalysis('');
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Content</h2>
        <p className="text-gray-600">Add your media and describe what you want to share</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Camera className="w-4 h-4 inline mr-2" />
              Upload Media (Optional)
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {formData.media ? (
                <div className="space-y-4">
                  {formData.media.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(formData.media)}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(formData.media)}
                      className="max-h-48 mx-auto rounded-lg shadow-md"
                      controls
                    />
                  )}
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{formData.media.name}</p>
                    <p>{(formData.media.size / 1024 / 1024).toFixed(2)} MB</p>
                    {analyzingImage && (
                      <div className="flex items-center justify-center mt-2">
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-blue-600">Analyzing image...</span>
                      </div>
                    )}
                    {uploading && (
                      <p className="text-blue-600">Uploading...</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, media: undefined }))}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Drop your files here</p>
                    <p className="text-gray-500 mt-1">or click to browse</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Choose Files
                  </button>
                  <p className="text-xs text-gray-400">Supports images and videos up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Content Details */}
          {imageAnalysis && (
            <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    AI Image Analysis
                  </h4>
                  <p className="text-blue-800 text-sm">{imageAnalysis}</p>
                </div>
                <button onClick={useImageAnalysis} className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                  Use This
                </button>
              </div>
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Content Description *
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={6}
                placeholder="Describe what you want to share... (e.g., 'Launch of our new eco-friendly water bottles with 50% recycled materials')"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about your message, key points, and call-to-action
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign ID (Optional)
              </label>
              <input
                type="text"
                value={formData.campaignId}
                onChange={(e) => setFormData(prev => ({ ...prev, campaignId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., spring-launch-2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Tags & Keywords
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Add keywords..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Target Platforms for This Post
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platformOptions.map(platform => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center space-x-2 ${
                      formData.selectedPlatforms?.includes(platform.id as Platform)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                    <span className="text-sm font-medium">{platform.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-700 py-4 px-8 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={!formData.prompt.trim() || !formData.selectedPlatforms?.length}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Generate Posts with AI
          </button>
        </div>
      </form>
    </div>
  );
};