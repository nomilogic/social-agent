import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, LogOut } from 'lucide-react';
import { getCurrentUser, saveCompany, savePost, updateCompany } from './lib/database';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { CompanySelector } from './components/CompanySelector';
import { ProgressBar } from './components/ProgressBar';
import { CompanySetup } from './components/CompanySetup';
import { ContentInput } from './components/ContentInput';
import { AIGenerator } from './components/AIGenerator';
import { PostPreview } from './components/PostPreview';
import { PublishPosts } from './components/PublishPosts'; // Import PublishPosts
import { OAuthCallback } from './components/OAuthCallback'; // Import OAuthCallback
import { StepData } from './types';

type Step = 'auth' | 'company-select' | 'company-setup' | 'content' | 'generate' | 'preview' | 'publish';

function App() {
  const [currentStep, setCurrentStep] = useState<Step>('auth');
  const [stepData, setStepData] = useState<StepData>({});
  const [user, setUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false); // State to control the publish modal

  React.useEffect(() => {
    initializeAuth();

    // Listen for custom event to show the publish modal
    const handleShowPublishModal = (event: CustomEvent) => {
      setStepData(prev => ({ ...prev, generatedPosts: event.detail })); // Ensure generatedPosts is in stepData
      setShowPublishModal(true);
    };

    window.addEventListener('showPublishModal', handleShowPublishModal as EventListener);

    return () => {
      window.removeEventListener('showPublishModal', handleShowPublishModal as EventListener);
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setCurrentStep('company-select');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAuthSuccess = (user: any) => {
    setUser(user);
    setCurrentStep('company-select');
  };

  const stepLabels = ['Company', 'Content Input', 'AI Generation', 'Preview', 'Publish'];
  const stepIndex = ['company-select', 'content', 'generate', 'preview', 'publish'].indexOf(currentStep);

  const handleCompanyNext = (companyInfo: any) => {
    const saveAndContinue = async () => {
      try {
        if (user) {
          let savedCompany;
          if (selectedCompany?.id) {
            savedCompany = await updateCompany(selectedCompany.id, companyInfo, user.id);
          } else {
            savedCompany = await saveCompany(companyInfo, user.id);
          }
          setStepData(prev => ({
            ...prev,
            company: companyInfo,
            companyId: savedCompany.id
          }));
          setSelectedCompany(savedCompany);
        } else {
          setStepData(prev => ({ ...prev, company: companyInfo }));
        }
        setCurrentStep('content');
      } catch (error) {
        console.error('Error saving company:', error);
        // Continue anyway with local data
        setStepData(prev => ({ ...prev, company: companyInfo }));
        setCurrentStep('content');
      }
    };

    saveAndContinue();
  };

  const handleContentNext = (contentData: any) => {
    setStepData(prev => ({ ...prev, content: contentData }));
    setCurrentStep('generate');
  };

  const handleGenerationComplete = (posts: any[]) => {
    const saveAndContinue = async () => {
      try {
        if (user && stepData.companyId && stepData.content) {
          await savePost(stepData.companyId, stepData.content, posts, user.id);
        }
        setStepData(prev => ({ ...prev, generatedPosts: posts }));
        setCurrentStep('preview');
      } catch (error) {
        console.error('Error saving post:', error);
        setStepData(prev => ({ ...prev, generatedPosts: posts }));
        setCurrentStep('preview');
      }
    };
    saveAndContinue();
  };

  const handleGoToPublish = () => {
    // Trigger the custom event to show the publish modal
    const publishEvent = new CustomEvent('showPublishModal', { detail: stepData.generatedPosts });
    window.dispatchEvent(publishEvent);
  };


  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setStepData(prev => ({ ...prev, company, companyId: company.id }));
    setCurrentStep('content');
  };

  const handleCreateNewCompany = () => {
    setCurrentStep('company-setup');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'company-setup':
        setCurrentStep('company-select');
        break;
      case 'content':
        setCurrentStep('company-select');
        break;
      case 'generate':
        setCurrentStep('content');
        break;
      case 'preview':
        setCurrentStep('content');
        break;
      case 'publish':
        setCurrentStep('preview');
        break;
    }
  };

  const handleRegenerate = () => {
    setCurrentStep('generate');
  };

  const resetToStart = () => {
    setCurrentStep('company-select');
    setStepData({});
    setSelectedCompany(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentStep('auth');
    setStepData({});
    setSelectedCompany(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Social AI Agent</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  // Check if this is an OAuth callback
  const path = window.location.pathname;
  if (path.startsWith('/oauth/') && path.endsWith('/callback')) {
    return <OAuthCallback />;
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Social AI Agent</h1>
                <p className="text-sm text-gray-600">AI-Powered Social Media Content Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
              )}
              {currentStep !== 'company-select' && (
                <button
                  onClick={resetToStart}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Start Over</span>
              </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
            )
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'company-select' && currentStep !== 'company-setup' && (
          <ProgressBar
            currentStep={stepIndex}
            totalSteps={4}
            stepLabels={stepLabels}
          />
        )}

        <div className="mt-8">
          {currentStep === 'company-select' && (
            <CompanySelector
              userId={user.id}
              onSelectCompany={handleSelectCompany}
              onCreateNew={handleCreateNewCompany}
            />
          )}

          {currentStep === 'company-setup' && (
            <CompanySetup
              onNext={handleCompanyNext}
              onBack={handleBack}
              initialData={selectedCompany}
            />
          )}

          {currentStep === 'content' && stepData.company && (
            <ContentInput
              onNext={handleContentNext}
              onBack={handleBack}
              initialData={stepData.content}
              selectedPlatforms={stepData.company.platforms}
            />
          )}

          {currentStep === 'generate' && stepData.company && stepData.content && (
            <AIGenerator
              companyInfo={stepData.company}
              contentData={stepData.content}
              onComplete={handleGenerationComplete}
            />
          )}

          {currentStep === 'preview' && stepData.generatedPosts && (
            <>
              <PostPreview
                posts={stepData.generatedPosts}
                onBack={handleBack}
                onRegenerate={handleRegenerate}
              />
              <div className="mt-8 flex justify-center">
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-bold shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  onClick={handleGoToPublish}
                >
                  Publish Posts
                </button>
              </div>
            </>
          )}

          {currentStep === 'publish' && stepData.generatedPosts && (
            <PublishPosts
              posts={stepData.generatedPosts || []}
              userId={user?.id || ''}
              onBack={() => setCurrentStep('preview')}
            />
          )}
        </div>
      </main>

      {/* Publish Modal */}
      {showPublishModal && stepData.generatedPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <PublishPosts
              posts={stepData.generatedPosts}
              onBack={() => setShowPublishModal(false)}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Social AI Agent. Powered by advanced AI for smarter social media content.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;