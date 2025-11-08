// Lazy import Farcaster SDK to avoid build errors if not available
let farcasterSDK: any = null;

const getFarcasterSDK = async () => {
  if (farcasterSDK !== null) return farcasterSDK;
  
  try {
    const sdkModule = await import('@farcaster/miniapp-sdk');
    farcasterSDK = sdkModule.sdk || sdkModule.default || sdkModule;
    return farcasterSDK;
  } catch (error) {
    console.warn('Farcaster SDK not available:', error);
    return null;
  }
};

/**
 * Detect if the app is running inside Farcaster Mini App context
 * More strict detection to avoid false positives
 */
export const isFarcasterMiniApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Method 1: Check for Farcaster SDK (most reliable)
  try {
    if (window.farcaster?.sdk) {
      return true;
    }
  } catch (e) {
    // SDK not available
  }
  
  // Method 2: Check user agent (more specific)
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('warpcast') || (ua.includes('farcaster') && ua.includes('miniapp'))) {
    return true;
  }
  
  // Method 3: Check for Farcaster-specific query params
  const params = new URLSearchParams(window.location.search);
  if (params.get('farcaster') === 'true' || params.get('miniapp') === 'true') {
    return true;
  }
  
  // Method 4: Check parent window (if embedded in iframe)
  // Only return true if we can actually verify the parent is Farcaster
  try {
    if (window.parent !== window) {
      const parentHost = window.parent.location.hostname;
      if (parentHost.includes('warpcast.com') || parentHost.includes('farcaster.xyz')) {
        return true;
      }
    }
  } catch (e) {
    // Cross-origin - could be Farcaster, but don't assume
    // Only return true if we have other indicators
    // Check if we have Farcaster SDK available
    try {
      if (window.farcaster?.sdk || window.farcaster?.wallet) {
        return true;
      }
    } catch (e2) {
      // No Farcaster indicators
    }
  }
  
  return false;
};

/**
 * Initialize Farcaster Mini App SDK
 * Call this early in your app lifecycle (e.g., in main.tsx or App.tsx)
 */
export const initializeFarcasterSDK = async (): Promise<{
  sdk: any;
  context: any;
  isReady: boolean;
} | null> => {
  if (typeof window === 'undefined') return null;
  
  try {
    const sdk = await getFarcasterSDK();
    if (!sdk) return null;
    
    // Initialize SDK - this must be called early
    await sdk.actions.ready();
    
    // Get context (user info, environment, etc.)
    const context = await sdk.context;
    
    return {
      sdk,
      context,
      isReady: true,
    };
  } catch (error) {
    console.warn('Farcaster SDK not available (running in standalone mode):', error);
    return null;
  }
};

/**
 * Get Farcaster SDK instance (if initialized)
 * This is the public export - uses the internal async function
 */
export const getFarcasterSDKInstance = async () => {
  if (typeof window === 'undefined') return null;
  return await getFarcasterSDK();
};

/**
 * Get Farcaster wallet provider (EIP-1193 compatible)
 */
export const getFarcasterWalletProvider = async () => {
  const sdk = await getFarcasterSDK();
  if (!sdk) return null;
  
  try {
    return sdk.wallet?.getEthereumProvider?.() || null;
  } catch (error) {
    console.warn('Farcaster wallet provider not available:', error);
    return null;
  }
};

/**
 * Get Farcaster context (user info, environment)
 */
export const getFarcasterContext = async () => {
  const sdk = await getFarcasterSDK();
  if (!sdk) return null;
  
  try {
    return await sdk.context;
  } catch (error) {
    console.warn('Farcaster context not available:', error);
    return null;
  }
};

