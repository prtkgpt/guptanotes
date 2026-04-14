import { useState } from 'react';
import { uploadMedia } from '../lib/storage';

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (userId, file, folder) => {
    setUploading(true);
    setProgress(0);
    try {
      // Supabase JS v2 doesn't expose upload progress, so simulate it
      setProgress(30);
      const result = await uploadMedia(userId, file, folder);
      setProgress(100);
      return result;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setUploading(false);
    setProgress(0);
  };

  return { upload, uploading, progress, reset };
}
