// src/hooks/use-request-deduplication.ts
import { useRef, useCallback } from 'react';

interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
  };
}

interface UseRequestDeduplicationOptions {
  ttl?: number; // Time to live in milliseconds
  maxCacheSize?: number;
}

export function useRequestDeduplication(options: UseRequestDeduplicationOptions = {}) {
  const { ttl = 5000, maxCacheSize = 50 } = options;
  const cacheRef = useRef<RequestCache>({});
  
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    // Remove expired entries
    Object.keys(cache).forEach(key => {
      if (cache[key] && now - cache[key].timestamp > ttl) {
        delete cache[key];
      }
    });
    
    // If still over max size, remove oldest entries
    const entries = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp);
    if (entries.length > maxCacheSize) {
      const toRemove = entries.slice(0, entries.length - maxCacheSize);
      toRemove.forEach(([key]) => delete cache[key]);
    }
  }, [ttl, maxCacheSize]);
  
  const deduplicate = useCallback(<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    cleanupCache();
    
    const cache = cacheRef.current;
    const now = Date.now();
    
    // Check if we have a valid cached request
    if (cache[key] && (now - cache[key].timestamp < ttl)) {
      console.log(`Deduplicating request: ${key}`);
      return cache[key].promise;
    }
    
    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up this specific entry after completion
      setTimeout(() => {
        delete cache[key];
      }, 1000);
    });
    
    cache[key] = {
      promise,
      timestamp: now
    };
    
    return promise;
  }, [ttl, cleanupCache]);
  
  const clear = useCallback(() => {
    cacheRef.current = {};
  }, []);
  
  const has = useCallback((key: string): boolean => {
    const cache = cacheRef.current;
    return !!(key in cache && cache[key] && (Date.now() - cache[key].timestamp < ttl));
  }, [ttl]);
  
  return {
    deduplicate,
    clear,
    has
  };
}