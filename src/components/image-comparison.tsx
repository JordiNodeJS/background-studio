
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight } from 'lucide-react'; // Using lucide icon

interface ImageComparisonProps {
  originalImageUrl: string;
  processedImageUrl: string;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({ originalImageUrl, processedImageUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInteractionMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let newPosition = ((clientX - containerRect.left) / containerRect.width) * 100;
    newPosition = Math.max(0, Math.min(100, newPosition)); 
    setSliderPosition(newPosition);
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;
    handleInteractionMove(event.clientX);
  }, [isDragging, handleInteractionMove]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isDragging) return;
    handleInteractionMove(event.touches[0].clientX);
  }, [isDragging, handleInteractionMove]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleInteractionStart = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    setIsDragging(true);
    if (event.type === 'mousedown') {
        handleInteractionMove((event as React.MouseEvent).clientX);
    } else if (event.type === 'touchstart') {
        handleInteractionMove((event as React.TouchEvent).touches[0].clientX);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleInteractionEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleInteractionEnd);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleInteractionEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging, handleMouseMove, handleTouchMove, handleInteractionEnd]);

  // Ensure images are loaded before allowing interaction or setting aspect ratio
  const [imgLoaded, setImgLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16/9); // Default aspect ratio

  useEffect(() => {
 if (originalImageUrl && processedImageUrl) {
 let originalLoaded = false;
 let processedLoaded = false;

      const checkBothLoaded = () => {
 if (originalLoaded && processedLoaded) {
 setImgLoaded(true);
        }
      };

 const originalImg = new window.Image();
 originalImg.src = originalImageUrl;
 originalImg.onload = () => {
 setAspectRatio(originalImg.naturalWidth / originalImg.naturalHeight);
 originalLoaded = true;
 checkBothLoaded();
      };
 originalImg.onerror = () => {
 // Fallback if original image fails to load, allow processed to load
 originalLoaded = true;
 checkBothLoaded();
      };

      const processedImg = new window.Image();
 processedImg.src = processedImageUrl;
 processedImg.onload = () => {
 processedLoaded = true;
 console.log('Processed image loaded successfully:', processedImageUrl);
 checkBothLoaded();
        };
 processedImg.onerror = () => {
 // If processed image fails to load, still show original
 processedLoaded = true;
 console.error('Failed to load processed image:', processedImageUrl);
 checkBothLoaded(); // Still check to potentially show original
        };
    }
 return () => {
 // Clean up is not necessary for Image objects used in this way.
    };
  }, [processedImageUrl]);
  if (!imgLoaded) {
    return (
      <div className="relative w-full max-w-4xl mx-auto bg-muted rounded-lg shadow-lg border border-border animate-pulse" style={{ aspectRatio: `${aspectRatio}` }}>
        {/* Placeholder for loading state */}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full max-w-4xl mx-auto select-none overflow-hidden rounded-lg shadow-lg border border-border"
      style={{ aspectRatio: `${aspectRatio}` }}
      onTouchStart={handleInteractionStart}
      onMouseDown={handleInteractionStart}
    >
      {/* Using simple <img> tags as requested for direct comparison */}
      <img
        src={originalImageUrl}
        alt="Original Image"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        data-ai-hint="original photo"
        draggable="false"
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={processedImageUrl}
          alt="Processed Image"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          data-ai-hint="processed photo"
          draggable="false"
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-1.5 bg-accent cursor-ew-resize group"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-accent border-2 border-background flex items-center justify-center shadow-md opacity-80 group-hover:opacity-100 transition-opacity">
          <ChevronsLeftRight className="text-accent-foreground h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default ImageComparison;
