import { clsx, type ClassValue } from 'clsx';
import { usePathname } from 'next/navigation';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFileType = (mimetype: string) => {
  switch (mimetype) {
    case 'application/pdf':
      return 'pdf';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/aac-adts':
      return 'aac';
    case 'video/mp4':
      return 'mp4';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'docx';
    case 'application/vnd.ms-powerpoint':
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'ppt';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xls';
    default:
      return 'pdf'; // Default to PDF if the MIME type is unknown
  }
};

export const convertKbToMb = (kb: number) => {
  const mb = kb / 1024000;
  return `${mb.toFixed(2)} mb`;
};

export const focusFace = (img: string) => {
  const newImg = img.split('upload/') as string[];
  // https://res.cloudinary.com/demo/image/upload/c_thumb,g_face,h_200,w_200/docs/model.jpg

  return `${newImg[0]}/upload/c_crop,g_face,h_150,w_150/${newImg[1]}`;
};

export const convertToMp3 = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return `${fileName}.mp3`;
  }

  return `${fileName.substring(0, lastDotIndex)}.mp3`;
};

export const formatGoogleDocsViewerURL = (fileURL: string) => {
  const baseURL = 'https://docs.google.com/gview';
  const params = {
    embedded: 'true',
    url: fileURL,
  };

  const formattedURL = Object.keys(params)
    .map((key) => {
      return (
        encodeURIComponent(key) +
        '=' +
        encodeURIComponent((params as any)[key as any])
      );
    })
    .join('&');

  return `${baseURL}?${formattedURL}`;
};

export function formatDateToCustomString(dateString: string): string {
  const date = new Date(dateString);

  // Get the day, month, and year from the date object
  const day = date.getDate();
  const year = date.getFullYear();
  const month = date.toLocaleString('default', { month: 'short' }); // 'Oct' for example

  // Determine the suffix for the day (st, nd, rd, th)
  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th'; // Handle 11th, 12th, 13th
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  // Format the date as '16th Oct 2024'
  return `${day}${getDaySuffix(day)} ${month} ${year}`;
}

export const combineDateTime = (date: Date, time: Date): Date => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = time.getHours();
  const minutes = time.getMinutes();

  return new Date(year, month, day, hours, minutes, 0, 0);
};

export const checkExpired = (date: string): boolean => {
  if (!date) return true;
  return new Date() > new Date(date);
};

export const validateFileType = (type: string) => {
  const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
  if (!validTypes.includes(type)) {
    throw new Error('Please upload a PNG, JPEG, or PDF file');
  }
  return true;
};

export const validateFileSize = (size: number) => {
  if (size > 5 * 1024 * 1024) {
    throw new Error('File size must be less than 5MB');
  }
  return true;
};

export function formatTime(seconds: number): string {
  // Handle invalid values (NaN, Infinity, negative)
  if (!Number.isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
    return '--:--';
  }
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")
  return `${mins}:${secs}`
}

export function hasSubmitted(submissions: any[], studentId: string): boolean {
  return submissions.some((s: any, idx) => s?.userId === studentId)
}