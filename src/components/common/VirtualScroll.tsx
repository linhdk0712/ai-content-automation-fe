import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Box, styled } from '@mui/material';

interface VirtualScrollProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ScrollContainer = styled(Box)({
  overflow: 'auto',
  position: 'relative'
});

const VirtualContent = styled(Box)({
  position: 'relative'
});

function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className,
  style
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(items.length - 1, visibleEnd + overscan);

    const visibleItems = items.slice(start, end + 1).map((item, index) => ({
      item,
      index: start + index
    }));

    return {
      visibleItems,
      totalHeight: items.length * itemHeight,
      offsetY: start * itemHeight
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  return (
    <ScrollContainer
      ref={scrollElementRef}
      className={className}
      style={{
        height: containerHeight,
        ...style
      }}
      onScroll={handleScroll}
    >
      <VirtualContent style={{ height: totalHeight }}>
        <Box
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <Box
              key={index}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderItem(item, index)}
            </Box>
          ))}
        </Box>
      </VirtualContent>
    </ScrollContainer>
  );
}

export default VirtualScroll;

// Infinite scroll hook
export const useInfiniteScroll = <T,>(
  fetchMore: () => Promise<T[]>,
  hasMore: boolean,
  threshold = 100
) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<T[]>([]);

  const handleScroll = useCallback(async (scrollTop: number) => {
    const scrollElement = document.documentElement;
    const scrollHeight = scrollElement.scrollHeight;
    const clientHeight = scrollElement.clientHeight;
    
    if (
      scrollHeight - scrollTop - clientHeight < threshold &&
      hasMore &&
      !loading
    ) {
      setLoading(true);
      try {
        const newItems = await fetchMore();
        setItems(prev => [...prev, ...newItems]);
      } catch (error) {
        console.error('Failed to fetch more items:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [fetchMore, hasMore, loading, threshold]);

  useEffect(() => {
    const handleWindowScroll = () => {
      handleScroll(window.scrollY);
    };

    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [handleScroll]);

  return { items, loading, setItems };
};

// Grid virtual scroll component
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  overscan = 5
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  const { visibleItems, totalWidth, totalHeight, offsetX, offsetY } = useMemo(() => {
    const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const totalRows = Math.ceil(items.length / columnsPerRow);

    const visibleRowStart = Math.floor(scrollTop / (itemHeight + gap));
    const visibleRowEnd = Math.min(
      visibleRowStart + Math.ceil(containerHeight / (itemHeight + gap)),
      totalRows - 1
    );

    const visibleColStart = Math.floor(scrollLeft / (itemWidth + gap));
    const visibleColEnd = Math.min(
      visibleColStart + Math.ceil(containerWidth / (itemWidth + gap)),
      columnsPerRow - 1
    );

    const rowStart = Math.max(0, visibleRowStart - overscan);
    const rowEnd = Math.min(totalRows - 1, visibleRowEnd + overscan);
    const colStart = Math.max(0, visibleColStart - overscan);
    const colEnd = Math.min(columnsPerRow - 1, visibleColEnd + overscan);

    const visibleItems = [];
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        const index = row * columnsPerRow + col;
        if (index < items.length) {
          visibleItems.push({
            item: items[index],
            index,
            x: col * (itemWidth + gap),
            y: row * (itemHeight + gap)
          });
        }
      }
    }

    return {
      visibleItems,
      totalWidth: columnsPerRow * (itemWidth + gap) - gap,
      totalHeight: totalRows * (itemHeight + gap) - gap,
      offsetX: colStart * (itemWidth + gap),
      offsetY: rowStart * (itemHeight + gap)
    };
  }, [
    items,
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    gap,
    scrollTop,
    scrollLeft,
    overscan
  ]);

  return (
    <ScrollContainer
      style={{
        width: containerWidth,
        height: containerHeight
      }}
      onScroll={handleScroll}
    >
      <VirtualContent
        style={{
          width: totalWidth,
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(({ item, index, x, y }) => (
          <Box
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: itemWidth,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </Box>
        ))}
      </VirtualContent>
    </ScrollContainer>
  );
}