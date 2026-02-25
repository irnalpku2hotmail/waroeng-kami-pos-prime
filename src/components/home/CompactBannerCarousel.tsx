
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const CompactBannerCarousel = () => {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(1); // start at 1 because of clone
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);
  const [dragDelta, setDragDelta] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ['banner-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'banner_images')
        .single();
      if (error) return [];
      return Array.isArray(data?.value) ? data.value : [];
    }
  });

  // For infinite loop: [lastClone, ...originals, firstClone]
  const extendedBanners = banners.length > 0
    ? [banners[banners.length - 1], ...banners, banners[0]]
    : [];

  const totalSlides = extendedBanners.length;
  const realCount = banners.length;

  // Auto-slide
  useEffect(() => {
    if (realCount <= 1 || isPaused || isDragging) return;
    const timer = setInterval(() => {
      goToNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [realCount, isPaused, isDragging, currentIndex]);

  const goToNext = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
  }, []);

  const goToPrev = useCallback(() => {
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
  }, []);

  const goToSlide = useCallback((i: number) => {
    setIsTransitioning(true);
    setCurrentIndex(i + 1); // +1 for clone offset
  }, []);

  // Handle infinite loop jump
  const handleTransitionEnd = useCallback(() => {
    if (currentIndex >= totalSlides - 1) {
      // At the firstClone → jump to real first
      setIsTransitioning(false);
      setCurrentIndex(1);
    } else if (currentIndex <= 0) {
      // At the lastClone → jump to real last
      setIsTransitioning(false);
      setCurrentIndex(realCount);
    }
  }, [currentIndex, totalSlides, realCount]);

  // Real index for dots
  const realIndex = currentIndex <= 0
    ? realCount - 1
    : currentIndex >= totalSlides - 1
      ? 0
      : currentIndex - 1;

  // Drag/swipe handlers
  const onDragStart = (clientX: number) => {
    setIsDragging(true);
    dragStartX.current = clientX;
    dragOffset.current = 0;
    setDragDelta(0);
  };
  const onDragMove = (clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - dragStartX.current;
    dragOffset.current = delta;
    setDragDelta(delta);
  };
  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = 50;
    if (dragOffset.current < -threshold) {
      goToNext();
    } else if (dragOffset.current > threshold) {
      goToPrev();
    }
    setDragDelta(0);
  };

  // Slide width percentages
  const slideWidth = isMobile ? 85 : 70; // % of container
  const peekSize = isMobile ? 7.5 : 15; // % on each side

  if (!banners.length) {
    return (
      <div className="w-full h-36 md:h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white mb-4">
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-bold">Selamat Datang di TokoQu!</h2>
          <p className="text-xs md:text-sm opacity-90">Temukan produk terbaik untuk Anda</p>
        </div>
      </div>
    );
  }

  const offset = -(currentIndex * slideWidth) + peekSize + (dragDelta / (containerRef.current?.offsetWidth || 1)) * 100;

  return (
    <div className="w-full mb-6 select-none">
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => { setIsPaused(false); onDragEnd(); }}
        onMouseDown={e => { e.preventDefault(); onDragStart(e.clientX); }}
        onMouseMove={e => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onTouchStart={e => onDragStart(e.touches[0].clientX)}
        onTouchMove={e => onDragMove(e.touches[0].clientX)}
        onTouchEnd={onDragEnd}
      >
        <div
          className={`flex ${isTransitioning && !isDragging ? 'transition-transform duration-500 ease-in-out' : ''}`}
          style={{ transform: `translateX(${offset}%)` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedBanners.map((imageUrl: string, index: number) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={index}
                className="flex-shrink-0 px-1.5 md:px-2"
                style={{ width: `${slideWidth}%` }}
              >
                <div
                  className={`relative w-full h-36 md:h-52 lg:h-60 overflow-hidden rounded-xl transition-all duration-500 ease-in-out cursor-grab active:cursor-grabbing ${
                    isActive ? 'shadow-lg scale-100 opacity-100' : 'scale-[0.92] opacity-70'
                  }`}
                >
                  <img
                    src={imageUrl || '/placeholder.svg'}
                    alt={`Banner ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    loading={index <= 2 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                  {!isActive && (
                    <div className="absolute inset-0 bg-black/10" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      {realCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((_: string, i: number) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === realIndex
                  ? 'w-6 h-2 bg-primary'
                  : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CompactBannerCarousel;
