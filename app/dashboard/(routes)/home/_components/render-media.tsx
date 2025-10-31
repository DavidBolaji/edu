'use client';

import { cn } from '@/app/_lib/utils';
import { useRouter } from 'next/navigation';
import React, { startTransition } from 'react';

const hashIcon = {
  AUDIO: '🎧',
  VIDEO: '🎥',
  EBOOK: '📚',
};

const RenderMedia: React.FC<{ media: Record<string, number> }> = ({
  media,
}) => {
  const mediaList = Object.keys(media);
  const router = useRouter();


  const renderMedia = mediaList.map((med, index) => (
    <div
      key={`${med}_${index}`}
      className={cn(
        'rounded-xl p-4 items-center col-span-3 shadow-lg relative space-y-3',
        {
          'bg-primary': med === 'AUDIO',
          'bg-yellow-300': med === 'VIDEO',
          'bg-green-400': med === 'EBOOK',
        }
      )}
      onClick={() => {
        // start showing the loading bar
        ; (window as any).__showTopProgress?.()
          ; (window as any).__showOverlayLoading?.()
        // perform the navigation
        startTransition(() => {
          router.push('/dashboard/unviewed')
        })
      }}
    >
      <h2 className="text-3xl mb-2">
        {hashIcon[med as keyof typeof hashIcon]}
      </h2>
      <h2 className="text-white font-semibold">{med}</h2>
      <h2 className="text-white text-xs">{media[med]} new</h2>

      {media[med] > 0 && (
        <div className="absolute top-2 bg-red-500 right-2 rounded-full w-4 h-4 items-center justify-center" />
      )}
    </div>
  ));
  return (
    <div className="grid grid-cols-9 gap-3">
      {renderMedia}
    </div>
  );
};

export default RenderMedia;
