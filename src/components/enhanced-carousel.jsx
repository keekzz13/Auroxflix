"use client"

import React, { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CarouselItem from './carouselItem'

const MediaCard = ({ item, isContinueWatching = false }) => {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => { 
      setIsMobile(window.innerWidth < 768) 
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  if (isContinueWatching) { 
    return <CarouselItem item={item} variant="continue" usePoster={isMobile} />
  }
  
  return (
    <div className="flex-shrink-0 w-32 sm:w-40 md:w-96 cursor-pointer animate-scale-in">
      <CarouselItem item={item} usePoster={isMobile} />
    </div>
  )
}

const CategorySkeleton = ({ title }) => (
  <div className="mb-8 animate-pulse">
    <div className="h-8 bg-gray-700 rounded w-48 mb-4"></div>
    <div className="flex space-x-4 overflow-hidden py-4 pl-4 -ml-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-32 sm:w-40 md:w-96 h-32 sm:h-40 md:h-56 bg-gray-700 rounded-2xl"></div>
      ))}
    </div>
  </div>
)

const EnhancedCategorySection = ({ title, items, isLoading: categoryLoading, isContinueWatching = false }) => {
  const [visibleItems, setVisibleItems] = useState(4)
  const [isLoading, setIsLoading] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef(null)

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const handleScroll = (e) => {
    const container = e.target
    const { scrollLeft, scrollWidth, clientWidth } = container
    
    updateScrollButtons()
    
    // Load more items when near the end
    if (scrollLeft + clientWidth >= scrollWidth - 200 && !isLoading && visibleItems < items.length) {
      setIsLoading(true)
      setVisibleItems(prev => Math.min(prev + 4, items.length))
      setIsLoading(false)
    }
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollContainerRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const scrollAmount = window.innerWidth >= 768 ? 800 : 300
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    updateScrollButtons()
    
    const container = scrollContainerRef.current
    if (container) {
      const resizeObserver = new ResizeObserver(updateScrollButtons)
      resizeObserver.observe(container)
      
      return () => resizeObserver.disconnect()
    }
  }, [items, visibleItems])

  const displayedItems = items.slice(0, visibleItems)

  if (categoryLoading) {
    return <CategorySkeleton title={title} />
  }

  return (
    <div className="mb-8 animate-slide-up relative group">
      <h2 className="text-xl sm:text-2xl text-white mb-1 px-4 sm:px-0">{title}</h2>
      
      {/* Desktop Navigation Buttons */}
      <div className="hidden md:block">
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all duration-300 ${
            canScrollLeft 
              ? 'bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100' 
              : 'bg-gray-600/30 text-gray-500 cursor-not-allowed opacity-0'
          } backdrop-blur-sm shadow-lg`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={scrollRight}
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full transition-all duration-300 ${
            canScrollRight 
              ? 'bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100' 
              : 'bg-gray-600/30 text-gray-500 cursor-not-allowed opacity-0'
          } backdrop-blur-sm shadow-lg`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-hide py-4 px-4 sm:pl-4 sm:-ml-4 scroll-smooth"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        {displayedItems.map((item, index) => {
          const key = isContinueWatching ? `${item.id}-${item.mediaType}-${item.season || 0}-${item.episode || 0}` : item.id
          return (
            <div key={key} className="animate-stagger" style={{animationDelay: `${index * 100}ms`}}>
              <MediaCard item={item} isContinueWatching={isContinueWatching} />
            </div>
          )
        })}
        {isLoading && (
          <div className="flex-shrink-0 w-32 sm:w-40 md:w-96 h-32 sm:h-40 md:h-56 flex items-center justify-center">
            <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 border-2 border-white border-solid border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedCategorySection
