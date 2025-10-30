'use client';

import { useRouter } from 'next/navigation';
import { Quiz } from '../types';
import { formatDateToCustomString } from '@/app/_lib/utils';
import { Card } from '@/app/_components/ui/card';
import { Copy, Check } from 'lucide-react';
import { useState, useEffect, startTransition } from 'react';

interface QuizCardProps {
  quiz: Quiz;
}

export const QuizCard = ({ quiz }: QuizCardProps) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const quizUrl = `${window.location.origin}/dashboard/host/take/${quiz.id}_${quiz.userId}`;

  const handleNavigate = () => {
    // start showing the loading bar
    ; (window as any).__showTopProgress?.()
      ; (window as any).__showOverlayLoading?.()
    // perform the navigation
    startTransition(() => {

      router.push(
        `/dashboard/host/host?quiz=${encodeURIComponent(JSON.stringify(quiz))}`
      );
    })
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(quizUrl);
    setCopied(true);
  };

  // ✅ Reset icon after 30 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all relative"
      onClick={handleNavigate}
    >
      <div className="flex justify-between items-center mb-2">
        <p className="text-lg font-bold text-gray-700">{quiz.title}</p>
        {/* ✅ Toggle icons */}
        <button
          onClick={handleCopyLink}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          {copied ? (
            <Check size={18} className="text-green-600" />
          ) : (
            <Copy size={18} className="text-gray-600" />
          )}
        </button>
      </div>

      <div className="text-sm text-gray-500 italic">
        Closes: {formatDateToCustomString(quiz.quizDate as unknown as string)}
      </div>
    </Card>
  );
};
