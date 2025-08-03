'use client'

import { useUnifiedIntentRouting } from '../use-unified-intent-routing';
import type { QueryIntent } from '@/lib/intent-classifier';
import type { APIRoutingState } from '../types/use-code-assistant.types';

export function useAPIRouting(
  selectedFiles: string[]
): APIRoutingState {
  // Use the unified intent routing hook
  const { routeIntent } = useUnifiedIntentRouting();

  const routeIntentToAPI = async (intent: QueryIntent, input: string, projectId: string) => {
    // Delegate to unified routing hook
    return await routeIntent(intent, input, projectId, selectedFiles);
  };

  return {
    routeIntentToAPI
  };
}