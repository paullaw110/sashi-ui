"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Pull distance to trigger refresh (default 80)
  maxPull?: number; // Maximum pull distance (default 150)
}

interface UsePullToRefreshReturn {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number; // 0 to 1
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 150,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const startY = useRef(0);
  const currentY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start if at top of scroll container
    const target = e.currentTarget as HTMLElement;
    if (target.scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, []);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0) {
        // Apply resistance to pull
        const resistance = 0.5;
        const distance = Math.min(diff * resistance, maxPull);
        setPullDistance(distance);
      }
    },
    [isPulling, isRefreshing, maxPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate([10, 50, 10]);
      }

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
