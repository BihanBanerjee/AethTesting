// Client-side request throttling to prevent API overload
// Implements rate limiting and exponential backoff

interface ThrottleState {
  lastRequestTime: number;
  requestCount: number;
  backoffMultiplier: number;
  isThrottled: boolean;
}

class RequestThrottler {
  private state: ThrottleState = {
    lastRequestTime: 0,
    requestCount: 0,
    backoffMultiplier: 1,
    isThrottled: false
  };

  private readonly minDelay = 1000; // 1 second minimum between requests
  private readonly maxRequestsPerMinute = 10; // Conservative limit
  private readonly backoffBase = 2; // Exponential backoff multiplier
  private readonly maxBackoff = 30000; // 30 seconds max backoff

  /**
   * Check if a request should be throttled
   */
  shouldThrottle(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.state.lastRequestTime;
    
    // Reset request count every minute
    if (timeSinceLastRequest > 60000) {
      this.state.requestCount = 0;
      this.state.backoffMultiplier = 1;
      this.state.isThrottled = false;
    }
    
    // Check rate limit
    if (this.state.requestCount >= this.maxRequestsPerMinute) {
      this.state.isThrottled = true;
      return true;
    }
    
    // Check minimum delay
    const requiredDelay = this.minDelay * this.state.backoffMultiplier;
    if (timeSinceLastRequest < requiredDelay) {
      return true;
    }
    
    return false;
  }

  /**
   * Record a successful request
   */
  recordRequest(): void {
    this.state.lastRequestTime = Date.now();
    this.state.requestCount++;
    // Reset backoff on successful request
    this.state.backoffMultiplier = 1;
    this.state.isThrottled = false;
  }

  /**
   * Record a failed request (increases backoff)
   */
  recordFailure(): void {
    this.state.backoffMultiplier = Math.min(
      this.state.backoffMultiplier * this.backoffBase,
      this.maxBackoff / this.minDelay
    );
    this.state.isThrottled = true;
  }

  /**
   * Get time to wait before next request
   */
  getWaitTime(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.state.lastRequestTime;
    const requiredDelay = this.minDelay * this.state.backoffMultiplier;
    
    return Math.max(0, requiredDelay - timeSinceLastRequest);
  }

  /**
   * Get current throttle status for user feedback
   */
  getStatus(): {
    isThrottled: boolean;
    waitTime: number;
    requestCount: number;
    maxRequests: number;
  } {
    return {
      isThrottled: this.state.isThrottled,
      waitTime: this.getWaitTime(),
      requestCount: this.state.requestCount,
      maxRequests: this.maxRequestsPerMinute
    };
  }
}

// Global throttler instance
const globalThrottler = new RequestThrottler();

/**
 * Throttled request wrapper
 */
export async function throttledRequest<T>(
  requestFn: () => Promise<T>,
  context: string = 'API request'
): Promise<T> {
  // Check if request should be throttled
  if (globalThrottler.shouldThrottle()) {
    const waitTime = globalThrottler.getWaitTime();
    const status = globalThrottler.getStatus();
    
    console.warn(
      `🚦 Request throttled for ${context}. ` +
      `Wait ${Math.ceil(waitTime / 1000)}s. ` +
      `(${status.requestCount}/${status.maxRequests} requests)`
    );
    
    // Wait for the required time
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  try {
    console.log(`🚀 Making throttled request: ${context}`);
    const result = await requestFn();
    globalThrottler.recordRequest();
    console.log(`✅ Throttled request completed: ${context}`);
    return result;
  } catch (error) {
    globalThrottler.recordFailure();
    console.error(`❌ Throttled request failed: ${context}`, error);
    throw error;
  }
}

/**
 * Get current throttle status for UI feedback
 */
export function getThrottleStatus() {
  return globalThrottler.getStatus();
}

/**
 * Check if requests are currently being throttled
 */
export function isThrottled(): boolean {
  return globalThrottler.shouldThrottle();
}

/**
 * Reset throttle state (use carefully)
 */
export function resetThrottle(): void {
  globalThrottler['state'] = {
    lastRequestTime: 0,
    requestCount: 0,
    backoffMultiplier: 1,
    isThrottled: false
  };
}