import { supabase } from './supabase';
import { CompanyInfo, PostContent, GeneratedPost } from '../types';

// Company operations
export async function saveCompany(companyInfo: CompanyInfo, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .insert({
      name: companyInfo.name,
      website: companyInfo.website,
      industry: companyInfo.industry,
      target_audience: companyInfo.targetAudience,
      brand_tone: companyInfo.brandTone,
      goals: companyInfo.goals,
      platforms: companyInfo.platforms,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving company:', error);
    throw error;
  }

  return data;
}

export async function getCompanies(userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }

  return data;
}

export async function updateCompany(companyId: string, updates: Partial<CompanyInfo>, userId: string) {
  const { data, error } = await supabase
    .from('companies')
    .update({
      name: updates.name,
      website: updates.website,
      industry: updates.industry,
      target_audience: updates.targetAudience,
      brand_tone: updates.brandTone,
      goals: updates.goals,
      platforms: updates.platforms,
      updated_at: new Date().toISOString()
    })
    .eq('id', companyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data;
}

export async function deleteCompany(companyId: string, userId: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
}

// Post operations
export async function savePost(
  companyId: string,
  contentData: PostContent,
  generatedPosts: GeneratedPost[],
  userId: string
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      company_id: companyId,
      prompt: contentData.prompt,
      tags: contentData.tags,
      campaign_id: contentData.campaignId,
      generated_content: generatedPosts,
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving post:', error);
    throw error;
  }

  return data;
}

export async function getPosts(userId: string, companyId?: string) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      companies (
        name,
        brand_tone
      )
    `)
    .eq('user_id', userId);

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }

  return data;
}

export async function deletePost(postId: string, userId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}

// Media upload
export async function uploadMedia(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading media:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(fileName);

  return publicUrl;
}

// Authentication helpers
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    // Don't log "Auth session missing!" as an error since it's expected for unauthenticated users
    if (error.message !== 'Auth session missing!') {
      console.error('Error getting current user:', error);
    }
    return null;
  }
  
  return user;
}

export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInAnonymously();
  
  if (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
  
  return data;
}