import { supabase } from './supabase';

const UPLOAD_TIMEOUT_MS = 30000;

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const uploadPromise = supabase.storage
      .from('karavan_images')
      .upload(filePath, file);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Yükleme zaman aşımına uğradı (30s)')), UPLOAD_TIMEOUT_MS)
    );

    const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]);

    if (uploadError) {
      console.error('Error uploading image:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from('karavan_images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return null;
  }
};
