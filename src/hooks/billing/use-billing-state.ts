import { useState, useMemo, useCallback } from 'react';

export interface BillingState {
  creditsToBuy: number;
  price: string;
  setCreditsToBuy: (credits: number) => void;
  resetCredits: () => void;
}

const DEFAULT_CREDITS = 100;
const CREDITS_PER_DOLLAR = 50;

export function useBillingState(): BillingState {
  const [creditsToBuy, setCreditsToBuyState] = useState(DEFAULT_CREDITS);

  // Memoize expensive calculation
  const price = useMemo(() => {
    return (creditsToBuy / CREDITS_PER_DOLLAR).toFixed(2);
  }, [creditsToBuy]);

  const setCreditsToBuy = useCallback((credits: number) => {
    setCreditsToBuyState(Math.max(10, Math.min(1000, credits))); // Bounds checking
  }, []);

  const resetCredits = useCallback(() => {
    setCreditsToBuyState(DEFAULT_CREDITS);
  }, []);

  return useMemo(() => ({
    creditsToBuy,
    price,
    setCreditsToBuy,
    resetCredits,
  }), [creditsToBuy, price, setCreditsToBuy, resetCredits]);
}