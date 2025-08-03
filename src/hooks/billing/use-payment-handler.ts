import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/trpc/react';

export interface PaymentHandlerState {
  isHandlingPayment: boolean;
  handlePaymentSuccess: () => void;
}

export function usePaymentHandler(): PaymentHandlerState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasHandledPayment = useRef(false);
  
  const paymentStatus = searchParams.get('payment_status');
  const utils = api.useUtils();

  const handlePaymentSuccess = useCallback(() => {
    if (hasHandledPayment.current) return;
    
    hasHandledPayment.current = true;
    
    // Invalidate credits query to refetch fresh data
    utils.project.getMyCredits.invalidate();
    
    // Show success message
    toast.success('Payment successful! Your credits have been added.');
    
    // Clean up URL
    const url = new URL(window.location.href);
    url.searchParams.delete('payment_status');
    router.replace(url.pathname, { scroll: false });
  }, [utils.project.getMyCredits, router]);

  // Handle payment success only once
  useEffect(() => {
    if (paymentStatus === 'success' && !hasHandledPayment.current) {
      handlePaymentSuccess();
    }
  }, [paymentStatus, handlePaymentSuccess]);

  const isHandlingPayment = paymentStatus === 'success' && !hasHandledPayment.current;
  
  return useMemo(() => ({
    isHandlingPayment,
    handlePaymentSuccess,
  }), [isHandlingPayment, handlePaymentSuccess]);
}