// Lazy import Farcaster SDK to avoid build errors if not available
let farcasterSDK: any = null;
let sdkInitialized = false;

const getFarcasterSDK = async () => {
  if (farcasterSDK !== null) return farcasterSDK;

  try {
    // First check if SDK is already available on window (Base Build pattern)
    if (typeof window !== 'undefined' && window.farcaster?.sdk) {
      console.log('Using Farcaster SDK from window.farcaster.sdk (Base Build pattern)');
      farcasterSDK = window.farcaster.sdk;
      return farcasterSDK;
    }

    // Try importing SDK module (fallback for other environments)
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
    // If import fails but window.farcaster exists, use that
    if (typeof window !== 'undefined' && window.farcaster?.sdk) {
      console.log('Falling back to window.farcaster.sdk');
      farcasterSDK = window.farcaster.sdk;
      return farcasterSDK;
    }
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
 * NOTE: This does NOT call ready() - you must call signalAppReady() after your app is fully loaded
 */
export const initializeFarcasterSDK = async (): Promise<{
  sdk: any;
  context: any;
  isReady: boolean;
} | null> => {
  if (typeof window === 'undefined') return null;

  // Prevent multiple initializations
  if (farcasterSDK !== null) {
    return {
      sdk: farcasterSDK,
      context: null,
      isReady: sdkInitialized,
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
 * Signal that the app is ready to display
 * Call this AFTER your app is fully loaded and ready to show content
 * This hides the splash screen in Farcaster Mini Apps
 */
export const signalAppReady = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  // Don't call ready() multiple times
  if (sdkInitialized) {
    console.log('Farcaster SDK already signaled as ready');
    return true;
  }

  try {
    // CRITICAL: Base Build pattern - use window.farcaster.sdk.actions.ready()
    // This matches the working DeCleanup app pattern
    if (window.farcaster?.sdk) {
      const sdk = window.farcaster.sdk;
      console.log('Found Farcaster SDK on window.farcaster.sdk');
      console.log('SDK structure:', {
        hasActions: !!sdk.actions,
        hasReady: !!sdk.ready,
        actionsKeys: sdk.actions ? Object.keys(sdk.actions) : [],
        sdkKeys: Object.keys(sdk || {}),
      });
      
      // Method 1: sdk.actions.ready() - This is the correct method for Base Build
      if (sdk.actions?.ready && typeof sdk.actions.ready === 'function') {
        try {
          await sdk.actions.ready();
          sdkInitialized = true;
          console.log('✅ Farcaster Mini App signaled as ready via sdk.actions.ready()');
          return true;
        } catch (error) {
          console.error('❌ sdk.actions.ready() failed:', error);
          // Continue to try other methods
        }
      }
      
      // Method 2: sdk.ready() - Fallback
      if (sdk.ready && typeof sdk.ready === 'function') {
        try {
          await sdk.ready();
          sdkInitialized = true;
          console.log('✅ Farcaster Mini App signaled as ready via sdk.ready()');
          return true;
        } catch (error) {
          console.error('❌ sdk.ready() failed:', error);
        }
      }
      
      // Method 3: Direct ready property
      if (typeof (sdk as any).ready === 'function') {
        try {
          await (sdk as any).ready();
          sdkInitialized = true;
          console.log('✅ Farcaster Mini App signaled as ready via direct ready()');
          return true;
        } catch (error) {
          console.error('❌ direct ready() failed:', error);
        }
      }
      
      console.warn('⚠️ SDK found but no ready() method available');
    }

    // Try importing SDK
    const sdk = await getFarcasterSDK();
    if (!sdk) {
      // Check if we're in Farcaster context but SDK import failed
      if (window.farcaster?.wallet || window.farcaster?.sdk) {
        console.warn('⚠️ Farcaster context detected but SDK import failed. Trying window.farcaster directly...');
        // Try calling ready on window.farcaster directly
        if (window.farcaster.ready && typeof window.farcaster.ready === 'function') {
          await window.farcaster.ready();
          sdkInitialized = true;
          console.log('✅ Farcaster Mini App signaled as ready via window.farcaster.ready()');
          return true;
        }
      }
      console.log('Farcaster SDK not available (running in standalone mode)');
      return false;
    }

    // Call ready() to signal the Mini App is loaded
    // This is required by Farcaster Mini App specification
    if (sdk.actions && typeof sdk.actions.ready === 'function') {
      await sdk.actions.ready();
      sdkInitialized = true;
      console.log('✅ Farcaster Mini App signaled as ready via sdk.actions.ready()');
      return true;
    } else if (sdk.ready && typeof sdk.ready === 'function') {
      await sdk.ready();
      sdkInitialized = true;
      console.log('✅ Farcaster Mini App signaled as ready via sdk.ready()');
      return true;
    } else {
      console.warn('⚠️ Farcaster SDK ready() method not found. SDK structure:', Object.keys(sdk || {}));
      // Last resort: try calling ready() directly if it exists
      if (typeof (sdk as any).ready === 'function') {
        await (sdk as any).ready();
        sdkInitialized = true;
        console.log('✅ Farcaster Mini App signaled as ready via direct ready() call');
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to signal Farcaster app ready:', error);
    // Try one more time with window.farcaster directly
    try {
      if (window.farcaster?.ready && typeof window.farcaster.ready === 'function') {
        await window.farcaster.ready();
        sdkInitialized = true;
        console.log('✅ Farcaster Mini App signaled as ready via window.farcaster.ready() (fallback)');
        return true;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback ready() call also failed:', fallbackError);
    }
    return false;
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

