'use client';

import React from 'react';
import { Button } from '@/app/_components/ui/button';
import { Card } from '@/app/_components/ui/card';
import { Slider } from '@/app/_components/ui/slider';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { cn } from '@/app/_lib/utils';

interface EbookControlsProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onGoToPage: (page: number) => void;
  className?: string;
}

export function EbookControls({
  currentPage,
  totalPages,
  onNextPage,
  onPreviousPage,
  onGoToPage,
  className
}: EbookControlsProps) {
  const [zoom, setZoom] = React.useState(100);
  const [rotation, setRotation] = React.useState(0);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(50, prev - 10));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePageChange = (value: number[]) => {
    const page = value[0];
    onGoToPage(page);
  };

  return (
    <Card 
      className={cn(
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
        'border shadow-lg p-4',
        className
      )}
      data-testid="ebook-controls"
    >
      <div className="flex flex-col space-y-4">
        {/* Page Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousPage}
            disabled={currentPage === 0}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">
              Page {currentPage + 1} of {totalPages || 1}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={onNextPage}
            disabled={currentPage >= totalPages - 1}
            className="h-10 w-10"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Page Slider */}
        {totalPages > 1 && (
          <div className="px-2">
            <Slider
              value={[currentPage]}
              max={totalPages - 1}
              step={1}
              onValueChange={handlePageChange}
              className="w-full"
            />
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center justify-center space-x-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-8 w-8"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-xs text-gray-500 min-w-[3rem] text-center">
            {zoom}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-8 w-8"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="h-8 w-8"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden elements to apply zoom and rotation - these would be used by parent component */}
      <div className="hidden" data-zoom={zoom} data-rotation={rotation} />
    </Card>
  );
}
