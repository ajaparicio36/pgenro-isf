'use server';
import { createClient } from '@/utils/supabase/server';

export async function uploadFile(file: File) {
  const supabase = await createClient();
  const randomName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(randomName, file);
  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(data.path);
  if (!urlData) {
    throw new Error(`Failed to get public URL`);
  }
  return { publicUrl: urlData.publicUrl };
}
