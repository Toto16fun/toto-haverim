import { supabase } from '@/integrations/supabase/client';

export interface FixtureGame {
  home: string;
  away: string;
  kickoff: string;
}

export interface PreviewResult {
  ok: boolean;
  preview: FixtureGame[];
  confidence: number;
  ok16: boolean;
}

export interface SaveResult {
  ok: boolean;
  saved: number;
  confidence: number;
  ok16: boolean;
}

export async function previewFixtureImage(imageUrl: string): Promise<PreviewResult> {
  const { data, error } = await supabase.functions.invoke('parse-fixture-image', { 
    body: { imageUrl, action: 'preview' } 
  });
  
  if (error) {
    console.error('Error previewing fixture image:', error);
    throw new Error(error.message || 'Failed to preview image');
  }
  
  return data as PreviewResult;
}

export async function saveFixtureImage(roundId: string, imageUrl: string): Promise<SaveResult> {
  const { data, error } = await supabase.functions.invoke('parse-fixture-image', { 
    body: { imageUrl, action: 'save', roundId } 
  });
  
  if (error) {
    console.error('Error saving fixture image:', error);
    throw new Error(error.message || 'Failed to save image');
  }
  
  return data as SaveResult;
}

export async function saveEditedGames(roundId: string, games: FixtureGame[]): Promise<SaveResult> {
  const { data, error } = await supabase.functions.invoke('parse-fixture-image', { 
    body: { action: 'save', roundId, games } 
  });
  
  if (error) {
    console.error('Error saving edited games:', error);
    throw new Error(error.message || 'Failed to save games');
  }
  
  return data as SaveResult;
}

// Helper function to upload image to Supabase Storage and get public URL
export async function uploadImageToStorage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `fixtures/${fileName}`;

  const { data, error } = await supabase.storage
    .from('fixture-images')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload image');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('fixture-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}