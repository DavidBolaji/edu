import React, { useState } from 'react';
import { useFormikContext } from 'formik';
// assumes same setup

import axios, { AxiosProgressEvent } from 'axios';
import { convertToMp3 } from '@/app/_lib/utils';
import { Loader2 } from 'lucide-react';

const link = process.env.NEXT_PUBLIC_CLOUDINARY_URL;

const Cloudinary = axios.create({
  baseURL: link,
});

type UploadMediaProps = {
  name: string;
  disabled?: boolean;
  margin: string;
  type: 'AUDIO' | 'VIDEO' | 'EBOOK' | 'IMAGE';
  fields: string[];
};

const UploadMedia: React.FC<UploadMediaProps> = ({
  name,
  disabled,
  margin,
  type,
  fields,
}) => {
  const { setFieldValue } = useFormikContext();
  const [fileName, setFilename] = useState('Select File');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setStartTime(new Date());

    const formData = new FormData();
    const fileMimeType = file.type;
    const rawFileName = file.name;

    setFilename(rawFileName);

    formData.append('file', file);
    formData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!
    );

    try {
      const response = await Cloudinary.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          const { loaded, total } = progressEvent;
          const progress = loaded / (total || 1);
          setUploadProgress(progress);
        },
      });

      const { secure_url } = response.data;
      setFieldValue(
        name,
        type === 'AUDIO' ? convertToMp3(secure_url) : secure_url
      );

      fields.forEach((val) => {
        if (val === 'size') {
          setFieldValue(val, file.size);
        } else {
          setFieldValue(val, type === 'AUDIO' ? 'audio/mpeg' : fileMimeType);
        }
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const getAcceptType = () => {
    switch (type) {
      case 'AUDIO':
        return 'audio/*';
      case 'VIDEO':
        return 'video/*';
      case 'IMAGE':
        return 'image/*';
      case 'EBOOK':
        return '.pdf,.doc,.docx';
      default:
        return '*/*';
    }
  };

  return (
    <div className={`relative flex items-center gap-2 ${margin}`}>
      <label className="cursor-pointer bg-white px-3 py-2 rounded-md border border-gray-300 flex items-center gap-2">
        <input
          type="file"
          accept={getAcceptType()}
          disabled={disabled}
          onChange={handleFileChange}
          className="hidden"
        />
        <span className="text-blue-600 truncate max-w-[150px]">{fileName}</span>
        {uploading && (
          <>
            <span>{(uploadProgress * 100).toFixed(2)}%</span>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </>
        )}
      </label>
    </div>
  );
};

export default UploadMedia;
