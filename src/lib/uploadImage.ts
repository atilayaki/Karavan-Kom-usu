import { supabase } from './supabase';

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('karavan_images')
      .upload(filePath, file);

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
