import { useState } from 'react';

import { toast } from 'sonner';
import { validateFileSize, validateFileType } from '../_lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { UPLOAD_URL_DATA } from '@/config';
import { updatePic } from '@/action/action';

const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_NAME!;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

const useUpload = ({ cb }: { cb: () => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleUpload = async (file: File) => {
    try {
      // Validate file type
      validateFileType(file.type);
      // Validate file size (5MB)
      validateFileSize(file.size);
      // upload starting
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data?.error) {
        return toast.error(`File upload error: ${data.error.message}`, {
          position: 'top-right',
        });
      }

      if (data.secure_url) {
        queryClient.setQueryData([UPLOAD_URL_DATA], data.secure_url);
      }
      await updatePic(data.secure_url);
      toast.success('File uploaded successfully', { position: 'top-right' });
      cb();
    } catch (error) {
      // handle error
      toast.error((error as Error).message, { position: 'top-right' });

      console.log((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return { handleUpload, isUploading };
};

export default useUpload;
