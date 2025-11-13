// Lazy import Farcaster SDK to avoid build errors if not available
let farcasterSDK: any = null;
let sdkInitialized = false;

const getFarcasterSDK = async () => {
  if (farcasterSDK !== null) return farcasterSDK;
  
  try {
    const sdkModule = await import('@farcaster/miniapp-sdk');
    // The SDK is typically exported as a default export or named export
    farcasterSDK = sdkModule.sdk || sdkModule.default || sdkModule;
    
    // If SDK has an init method, call it
    if (farcasterSDK && typeof farcasterSDK.init === 'function') {
      await farcasterSDK.init();
    }
    
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
 * This is required for Farcaster Mini Apps to signal they're ready
 */
export const initializeFarcasterSDK = async (): Promise<{
  sdk: any;
  context: any;
  isReady: boolean;
} | null> => {
  if (typeof window === 'undefined') return null;
  
  // Prevent multiple initializations
  if (sdkInitialized) {
    return {
      sdk: farcasterSDK,
      context: null,
      isReady: true,
    };
  }
  
  try {
    const sdk = await getFarcasterSDK();
    if (!sdk) {
      // Check if we're in Farcaster context but SDK failed to load
      if (window.farcaster?.wallet || window.farcaster?.sdk) {
        console.warn('Farcaster context detected but SDK failed to load');
      }
      return null;
    }
    
    // Call ready() to signal the Mini App is loaded
    // This is required by Farcaster Mini App specification
    if (sdk.actions && typeof sdk.actions.ready === 'function') {
      await sdk.actions.ready();
      sdkInitialized = true;
    } else if (sdk.ready && typeof sdk.ready === 'function') {
      await sdk.ready();
      sdkInitialized = true;
    } else {
      console.warn('Farcaster SDK ready() method not found');
    }
    
    // Get context (user info, environment, etc.)
    let context = null;
    try {
      if (sdk.context) {
        context = typeof sdk.context === 'function' 
          ? await sdk.context() 
          : await sdk.context;
      }
    } catch (ctxError) {
      console.warn('Could not get Farcaster context:', ctxError);
    }
    
    return {
      sdk,
      context,
      isReady: sdkInitialized,
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
 * This provider can be used with wagmi/viem for transactions
 */
export const getFarcasterWalletProvider = async () => {
  // First check if wallet is directly available on window
  if (typeof window !== 'undefined') {
    // Check for Farcaster wallet on window object
    if (window.farcaster?.wallet) {
      // If it's already an EIP-1193 provider, return it directly
      if (window.farcaster.wallet.request && window.farcaster.wallet.on) {
        return window.farcaster.wallet;
      }
    }
    
    // Check for SDK wallet
    if (window.farcaster?.sdk?.wallet) {
      const wallet = window.farcaster.sdk.wallet;
      if (wallet.getEthereumProvider) {
        return wallet.getEthereumProvider();
      }
      if (wallet.request && wallet.on) {
        return wallet;
      }
    }
  }
  
  // Try to get from SDK
  try {
    const sdk = await getFarcasterSDK();
    if (!sdk) return null;
    
    // Try different methods to get the provider
    if (sdk.wallet?.getEthereumProvider) {
      return sdk.wallet.getEthereumProvider();
    }
    if (sdk.wallet && typeof sdk.wallet.request === 'function') {
      return sdk.wallet;
    }
    if (sdk.getEthereumProvider) {
      return sdk.getEthereumProvider();
    }
    
    return null;
  } catch (error) {
    console.warn('Farcaster wallet provider not available:', error);
    return null;
  }
};

/**
 * Get Farcaster context (user info, environment)
 * Returns user information when running in Farcaster Mini App
 */
export const getFarcasterContext = async () => {
  try {
    const sdk = await getFarcasterSDK();
    if (!sdk) return null;
    
    if (sdk.context) {
      // Context might be a promise or a direct value
      return typeof sdk.context === 'function' 
        ? await sdk.context() 
        : await Promise.resolve(sdk.context);
    }
    
    // Fallback: check window.farcaster for context
    if (typeof window !== 'undefined' && window.farcaster?.context) {
      return window.farcaster.context;
    }
    
    return null;
  } catch (error) {
    console.warn('Farcaster context not available:', error);
    return null;
  }
};

/**
 * Check if Farcaster wallet is available and ready
 */
export const isFarcasterWalletAvailable = async (): Promise<boolean> => {
  if (!isFarcasterMiniApp()) return false;
  
  try {
    const provider = await getFarcasterWalletProvider();
    return provider !== null;
  } catch {
    return false;
  }
};

