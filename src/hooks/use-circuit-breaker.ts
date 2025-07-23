// src/hooks/use-circuit-breaker.ts
import { useRef, useCallback } from 'react';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerOptions {
  failureThreshold?: number; // Number of failures before opening
  recoveryTimeout?: number; // Time in ms before trying half-open
  monitoringPeriod?: number; // Time window for counting failures
}

interface CircuitBreakerData {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export function useCircuitBreaker(options: CircuitBreakerOptions = {}) {
  const { 
    failureThreshold = 3, 
    recoveryTimeout = 30000, // 30 seconds
    monitoringPeriod = 60000 // 1 minute
  } = options;
  
  const circuitRef = useRef<CircuitBreakerData>({
    state: 'closed',
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0
  });
  
  const getState = useCallback((): CircuitState => {
    const circuit = circuitRef.current;
    const now = Date.now();
    
    // Reset failure count if monitoring period has passed
    if (now - circuit.lastFailureTime > monitoringPeriod) {
      circuit.failureCount = 0;
    }
    
    // Check if we can transition from open to half-open
    if (circuit.state === 'open' && now >= circuit.nextAttemptTime) {
      circuit.state = 'half-open';
      console.log('Circuit breaker transitioning to half-open');
    }
    
    return circuit.state;
  }, [monitoringPeriod]);
  
  const recordSuccess = useCallback(() => {
    const circuit = circuitRef.current;
    
    if (circuit.state === 'half-open') {
      console.log('Circuit breaker closing after successful request');
      circuit.state = 'closed';
      circuit.failureCount = 0;
    }
  }, []);
  
  const recordFailure = useCallback((error?: Error) => {
    const circuit = circuitRef.current;
    const now = Date.now();
    
    circuit.failureCount += 1;
    circuit.lastFailureTime = now;
    
    console.log(`Circuit breaker recorded failure ${circuit.failureCount}/${failureThreshold}:`, error?.message);
    
    if (circuit.failureCount >= failureThreshold) {
      circuit.state = 'open';
      circuit.nextAttemptTime = now + recoveryTimeout;
      console.log(`Circuit breaker opened. Next attempt at: ${new Date(circuit.nextAttemptTime).toISOString()}`);
    }
  }, [failureThreshold, recoveryTimeout]);
  
  const execute = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> => {
    const state = getState();
    
    if (state === 'open') {
      const error = new Error('Circuit breaker is open - request blocked');
      console.log('Circuit breaker blocking request');
      
      if (fallback) {
        return await fallback();
      }
      throw error;
    }
    
    try {
      const result = await operation();
      recordSuccess();
      return result;
    } catch (error) {
      recordFailure(error as Error);
      
      if (fallback && state === 'closed') {
        console.log('Using fallback after circuit breaker failure');
        return await fallback();
      }
      
      throw error;
    }
  }, [getState, recordSuccess, recordFailure]);
  
  const reset = useCallback(() => {
    console.log('Circuit breaker manually reset');
    circuitRef.current = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0
    };
  }, []);
  
  const getStats = useCallback(() => {
    const circuit = circuitRef.current;
    return {
      state: getState(),
      failureCount: circuit.failureCount,
      lastFailureTime: circuit.lastFailureTime,
      nextAttemptTime: circuit.nextAttemptTime
    };
  }, [getState]);
  
  return {
    execute,
    reset,
    getStats,
    getState
  };
}