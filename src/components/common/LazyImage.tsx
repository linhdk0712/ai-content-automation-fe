import React, { useState, useRef, useEffect, memo } from 'react';
import { Box, Skeleton, styled } from '@mui/material';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholder?: React.ReactNode;
  fallback?: string;
  sizes?: string;
  srcSet?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

const ImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  display: 'inline-block',
  '& img': {
    transition: 'opacity 0.3s ease-in-out',
    maxWidth: '100%',
    height: 'auto'
  }
}));

const LazyImage: React.FC<LazyImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  fallback = '/images/placeholder.jpg',
  sizes,
  srcSet,
  loading = 'lazy',
  onLoad,
  onError,
  style
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate WebP srcSet if supported
  const generateSrcSet = (originalSrc: string): string => {
    if (srcSet) return srcSet;
    
    // Check WebP support
    const supportsWebP = (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })();

    if (supportsWebP && originalSrc.match(/\.(jpg|jpeg|png)$/i)) {
      const webpSrc = originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      return `${webpSrc} 1x, ${originalSrc} 1x`;
    }

    return originalSrc;
  };

  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }

    return (
      <Skeleton
        variant="rectangular"
        width={width || '100%'}
        height={height || 200}
        animation="wave"
        sx={{
          bgcolor: 'grey.300',
          borderRadius: 1
        }}
      />
    );
  };

  return (
    <ImageContainer
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        ...style
      }}
    >
      {!isInView && renderPlaceholder()}
      
      {isInView && (
        <>
          {!isLoaded && !hasError && renderPlaceholder()}
          
          <img
            ref={imgRef}
            src={hasError ? fallback : src}
            alt={alt}
            srcSet={hasError ? undefined : generateSrcSet(src)}
            sizes={sizes}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              opacity: isLoaded ? 1 : 0,
              position: isLoaded ? 'static' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loading={loading}
            decoding="async"
          />
        </>
      )}
    </ImageContainer>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;

// Hook for preloading images
export const useImagePreloader = () => {
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  };

  const preloadImages = async (sources: string[]): Promise<void> => {
    try {
      await Promise.all(sources.map(preloadImage));
    } catch (error) {
      console.warn('Failed to preload some images:', error);
    }
  };

  return { preloadImage, preloadImages };
};

// Progressive image loading component
export const ProgressiveImage: React.FC<LazyImageProps & {
  lowQualitySrc?: string;
}> = memo(({ lowQualitySrc, ...props }) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || props.src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (lowQualitySrc && lowQualitySrc !== props.src) {
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(props.src);
        setIsHighQualityLoaded(true);
      };
      img.src = props.src;
    }
  }, [props.src, lowQualitySrc]);

  return (
    <LazyImage
      {...props}
      src={currentSrc}
      style={{
        ...props.style,
        filter: !isHighQualityLoaded && lowQualitySrc ? 'blur(2px)' : 'none',
        transition: 'filter 0.3s ease-in-out'
      }}
    />
  );
});

ProgressiveImage.displayName = 'ProgressiveImage';