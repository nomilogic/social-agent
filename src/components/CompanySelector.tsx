import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { getCompanies, deleteCompany } from '../lib/database';
import { CompanyInfo } from '../types';

interface CompanySelectorProps {
  userId: string;
  onSelectCompany: (company: CompanyInfo & { id: string }) => void;
  onCreateNew: () => void;
}

export const CompanySelector: React.FC<CompanySelectorProps> = ({
  userId,
  onSelectCompany,
  onCreateNew
}) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, [userId]);

  const loadCompanies = async () => {
    try {
      const data = await getCompanies(userId);
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (companyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany(companyId, userId);
        setCompanies(prev => prev.filter(c => c.id !== companyId));
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Company</h2>
        <p className="text-gray-600">Choose a company or create a new one</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Company Card */}
        <div
          onClick={onCreateNew}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
        >
          <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">Create New Company</h3>
          <p className="text-sm text-gray-600">Set up a new brand profile</p>
        </div>

        {/* Existing Companies */}
        {companies.map((company) => (
          <div
            key={company.id}
            onClick={() => onSelectCompany({
              id: company.id,
              name: company.name,
              website: company.website,
              industry: company.industry,
              targetAudience: company.target_audience,
              brandTone: company.brand_tone,
              goals: company.goals,
              platforms: company.platforms
            })}
            className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200 relative group"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => handleDelete(company.id, e)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 text-lg">{company.name}</h3>
              {company.industry && (
                <p className="text-sm text-gray-600">{company.industry}</p>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Tone:</span>
                <span className="ml-2 capitalize">{company.brand_tone}</span>
              </div>
              <div>
                <span className="text-gray-500">Platforms:</span>
                <span className="ml-2">{company.platforms?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Goals:</span>
                <span className="ml-2">{company.goals?.length || 0}</span>
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-1">
              {company.platforms?.slice(0, 3).map((platform: string) => (
                <span
                  key={platform}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize"
                >
                  {platform}
                </span>
              ))}
              {company.platforms?.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  +{company.platforms.length - 3} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};