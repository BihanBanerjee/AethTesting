import { useMemo, useCallback } from 'react';
import { api } from '@/trpc/react';
import { useBillingState } from './use-billing-state';
import { usePaymentHandler } from './use-payment-handler';

export interface BillingComposition {
  // Billing state
  creditsToBuy: number;
  price: string;
  setCreditsToBuy: (credits: number) => void;
  resetCredits: () => void;
  
  // User data
  userCredits: number;
  isLoadingCredits: boolean;
  
  // Payment handling
  isHandlingPayment: boolean;
  handlePaymentSuccess: () => void;
  
  // Purchase action
  purchaseCredits: () => void;
}

export function useBillingComposition(): BillingComposition {
  const billingState = useBillingState();
  const paymentHandler = usePaymentHandler();
  
  const { data: user, isLoading: isLoadingCredits } = api.project.getMyCredits.useQuery();
  
  const purchaseCredits = useCallback(async () => {
    const { createCheckOutSession } = await import('@/lib/stripe');
    await createCheckOutSession(billingState.creditsToBuy);
  }, [billingState.creditsToBuy]);

  return useMemo(() => ({
    // Billing state
    creditsToBuy: billingState.creditsToBuy,
    price: billingState.price,
    setCreditsToBuy: billingState.setCreditsToBuy,
    resetCredits: billingState.resetCredits,
    
    // User data
    userCredits: user?.credits || 0,
    isLoadingCredits,
    
    // Payment handling
    isHandlingPayment: paymentHandler.isHandlingPayment,
    handlePaymentSuccess: paymentHandler.handlePaymentSuccess,
    
    // Purchase action
    purchaseCredits,
  }), [
    // Billing state dependencies (stable references from useBillingState)
    billingState.creditsToBuy,
    billingState.price,
    billingState.setCreditsToBuy,
    billingState.resetCredits,
    
    // User data
    user?.credits,
    isLoadingCredits,
    
    // Payment handling dependencies
    paymentHandler.isHandlingPayment,
    paymentHandler.handlePaymentSuccess,
    
    // Purchase action (stable)
    purchaseCredits,
  ]);
}