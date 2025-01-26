import { supabase } from './supabase';

export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    // Logo por defecto actualizado
    const DEFAULT_LOGO = 'https://vlvdykzznjdnfcsutloc.supabase.co/storage/v1/object/sign/Imagenes/LOGO%20SIN%20RELLENO.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZW5lcy9MT0dPIFNJTiBSRUxMRU5PLnBuZyIsImlhdCI6MTczNjcyNjE3NywiZXhwIjoxNzY4MjYyMTc3fQ.LjJRGsZLRt5JMWU4dkMvfzkfGMo35ikw0ksDcYlVNnE&t=2025-01-12T23%3A55%3A37.904Z';
    
    if (key === 'logo_url') {
      return DEFAULT_LOGO;
    }
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    
    if (error) {
      console.warn(`Error fetching setting ${key}:`, error);
      return null;
    }
    
    return data?.value || null;
  } catch (error) {
    console.error('Error fetching system setting:', error);
    return null;
  }
}