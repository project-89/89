"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TrainingMissionCard, TrainingMissionData } from "./TrainingMissionCard";

interface TrainingMissionCarouselProps {
  missions: TrainingMissionData[];
  onMissionClick: (mission: TrainingMissionData) => void;
  className?: string;
}

export function TrainingMissionCarousel({ 
  missions, 
  onMissionClick, 
  className = "" 
}: TrainingMissionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show the current active or first available mission
  useEffect(() => {
    const activeIndex = missions.findIndex(m => m.status === "active");
    const availableIndex = missions.findIndex(m => m.status === "available");
    const initialIndex = activeIndex !== -1 ? activeIndex : availableIndex !== -1 ? availableIndex : 0;
    
    if (initialIndex > 0) {
      setCurrentIndex(initialIndex);
    }
  }, [missions]);

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = 350; // Fixed card width
      const gap = 16; // Gap between cards (matching gap-4)
      const scrollPosition = index * (cardWidth + gap);
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "smooth"
      });
    }
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(missions.length - 1, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  // State for tracking if we can scroll
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Update scroll buttons based on actual scroll position
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll);
      // Check initially after a small delay to ensure DOM is ready
      setTimeout(checkScroll, 100);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', checkScroll);
      }
    };
  }, [missions]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Left Navigation Button */}
      <button
        onClick={handlePrevious}
        disabled={!canScrollLeft}
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 z-20
          w-12 h-12 rounded-full bg-gray-900/80 border border-gray-700
          flex items-center justify-center
          transition-all duration-300
          ${canScrollLeft ? "hover:bg-gray-800 hover:border-gray-600" : "opacity-50 cursor-not-allowed"}
          ${isHovering || canScrollLeft ? "translate-x-0 opacity-100" : "-translate-x-14 opacity-0"}
        `}
      >
        <ChevronLeft className="w-6 h-6 text-gray-300" />
      </button>

      {/* Right Navigation Button */}
      <button
        onClick={handleNext}
        disabled={!canScrollRight}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-20
          w-12 h-12 rounded-full bg-gray-900/80 border border-gray-700
          flex items-center justify-center
          transition-all duration-300
          ${canScrollRight ? "hover:bg-gray-800 hover:border-gray-600" : "opacity-50 cursor-not-allowed"}
          ${isHovering || canScrollRight ? "translate-x-0 opacity-100" : "translate-x-14 opacity-0"}
        `}
      >
        <ChevronRight className="w-6 h-6 text-gray-300" />
      </button>

      {/* Carousel Container */}
      <div style={{ overflow: 'hidden' }}>
        <div className="py-4" style={{ margin: '-1rem 0' }}>
          <div 
            ref={scrollRef}
            className="flex gap-4 scrollbar-hide"
            style={{
              overflowX: 'scroll',
              overflowY: 'visible',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingTop: '1rem',
              paddingBottom: '1rem',
              scrollPaddingLeft: '24px'
            }}
          >
          {missions.map((mission, index) => (
            <div
              key={mission.id}
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                paddingLeft: index === 0 ? '0' : '0',
                paddingRight: index === missions.length - 1 ? '24px' : '0'
              }}
            >
              <TrainingMissionCard
                mission={mission}
                onClick={() => onMissionClick(mission)}
                className={`
                  transition-all duration-700 ease-out
                  ${index === currentIndex ? "scale-[1.02]" : ""}
                `}
              />
            </div>
          ))}
            {/* Extra padding at the end to ensure last card is fully visible */}
            <div className="w-4 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {missions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              scrollToIndex(index);
            }}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentIndex 
                ? "w-8 bg-primary-500" 
                : "bg-gray-600 hover:bg-gray-500"
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}