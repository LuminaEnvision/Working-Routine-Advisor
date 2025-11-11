import { createConfig } from "wagmi";
import { http } from "viem";
import { celo, celoAlfajores } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
// import { SafeConnector } from "wagmi/connectors/safe"; // Removed for MVP
import { InjectedConnector } from "wagmi/connectors/injected";
import { createFarcasterConnector } from "./farcaster-connector";
import { isFarcasterMiniApp, getFarcasterWalletProvider } from "./farcaster-miniapp";

const rpcUrl = import.meta.env.VITE_CELO_RPC_URL ?? "https://forno.celo.org";
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

// Use mainnet (no testnet addresses provided)
const targetChain = celo;

const appMetadata = {
  name: "Working Routine Advisor",
  icon: "https://farcaster-working-routine-advisor.app/icon.png",
};

const connectors = [];

// 1. Farcaster connector (always add if in Farcaster context, or as fallback)
// Try to create Farcaster connector - it will return null if not in Farcaster context
const farcasterConn = createFarcasterConnector([targetChain]);
if (farcasterConn) {
  connectors.push(farcasterConn);
}

// Also add InjectedConnector for Farcaster wallet (if available)
// This will catch Farcaster wallet even if createFarcasterConnector returns null
if (typeof window !== 'undefined') {
  // Check if Farcaster wallet is available
  const hasFarcasterWallet = window.farcaster?.wallet || window.farcaster?.sdk;
  if (hasFarcasterWallet) {
    connectors.push(
      new InjectedConnector({
        chains: [targetChain],
        options: {
          name: 'Farcaster Wallet',
          shimDisconnect: true,
          getProvider: async () => {
            // Try to get Farcaster wallet provider
            try {
              const { getFarcasterWalletProvider } = await import('./farcaster-miniapp');
              const provider = await getFarcasterWalletProvider();
              if (provider) return provider;
            } catch (e) {
              // Fallback to window.farcaster.wallet if available
              if (window.farcaster?.wallet) {
                return window.farcaster.wallet;
              }
            }
            return window.ethereum;
          },
        },
      })
    );
  }
}

// 2. MetaMask (for standalone web app)
// Always add MetaMask connector - it will check if MetaMask is installed
// Note: In Safari, MetaMask might not be detected immediately, but the connector will still work
connectors.push(
  new MetaMaskConnector({
    chains: [targetChain],
    options: {
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
      // For Safari compatibility, add a small delay before checking for MetaMask
      ...(typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ? {
        // Safari-specific options if needed
      } : {}),
    },
  })
);

// 2b. Injected connector as fallback (for other injected wallets like Brave, etc.)
// This will also catch MetaMask if MetaMaskConnector doesn't work
// Safari needs special handling - window.ethereum might not be available immediately
if (typeof window !== 'undefined') {
  // Check for Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // For non-Safari browsers, only add InjectedConnector if:
  // 1. window.ethereum exists AND
  // 2. It's NOT MetaMask (we already have MetaMaskConnector for that)
  // This prevents duplicate MetaMask options
  if (!isSafari && window.ethereum && !(window.ethereum as any).isMetaMask) {
    connectors.push(
      new InjectedConnector({
        chains: [targetChain],
        options: {
          name: 'Injected',
          shimDisconnect: true,
        },
      })
    );
  } else if (isSafari) {
    // Safari: Add InjectedConnector with dynamic provider detection
    // This will catch MetaMask and other injected wallets in Safari
    // Note: In Safari, MetaMask might not work due to browser security restrictions
    // The connector will try to detect it, but it may not be available
    connectors.push(
      new InjectedConnector({
        chains: [targetChain],
        options: {
          name: 'Injected Wallet', // Generic name - will work with any injected wallet
          shimDisconnect: true,
          getProvider: async () => {
            // Retry mechanism for Safari - wait for window.ethereum to be available
            let retries = 0;
            const maxRetries = 20; // Increased retries for Safari
            while (retries < maxRetries) {
              if (window.ethereum) {
                return window.ethereum;
              }
              await new Promise(resolve => setTimeout(resolve, 100));
              retries++;
            }
            // If still not available, return null instead of throwing
            // This allows the connector to show as not ready without causing unhandled promise rejections
            console.warn('No injected wallet provider found. Please install MetaMask or another wallet extension.');
            return null;
          },
        },
      })
    );
  }
}

// 3. WalletConnect (for mobile wallets and Safari fallback)
// Always try to add WalletConnect - it's the best fallback for Safari
// Only skip if project ID is explicitly missing (not just empty string)
if (walletConnectProjectId && walletConnectProjectId !== '' && walletConnectProjectId !== 'fallback') {
  try {
    connectors.push(
      new WalletConnectConnector({
        chains: [targetChain],
        options: {
          projectId: walletConnectProjectId,
          showQrModal: true,
          metadata: appMetadata,
        },
      })
    );
  } catch (error) {
    console.warn('Failed to initialize WalletConnect:', error);
    // Continue without WalletConnect if initialization fails
  }
} else {
  // Warn if WalletConnect is not available - it's important for Safari users
  if (typeof window !== 'undefined') {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      console.warn(
        'WalletConnect is not configured. Safari users may have difficulty connecting wallets. ' +
        'Please set VITE_WALLETCONNECT_PROJECT_ID environment variable.'
      );
    }
  }
}

// 4. Safe connector (optional - only for multi-sig wallets)
// Removed for MVP - uncomment if you need Safe wallet support
// connectors.push(
//   new SafeConnector({
//     chains: [targetChain],
//     options: {
//       allowedDomains: [/app.safe.global$/],
//       debug: false,
//     },
//   })
// );

// Ensure we have at least one connector
// If no connectors, add a fallback to prevent wagmi config errors
if (connectors.length === 0) {
  console.warn('No wallet connectors available. Adding fallback connectors.');
  // Try to add MetaMask as fallback (should always be available)
  try {
    connectors.push(
      new MetaMaskConnector({
        chains: [targetChain],
        options: {
          shimDisconnect: true,
        },
      })
    );
  } catch (error) {
    console.warn('Failed to add MetaMask fallback:', error);
  }
  
  // Only add WalletConnect if project ID is properly configured
  if (walletConnectProjectId && walletConnectProjectId !== '' && walletConnectProjectId !== 'fallback') {
    try {
      connectors.push(
        new WalletConnectConnector({
          chains: [targetChain],
          options: {
            projectId: walletConnectProjectId,
            showQrModal: true,
            metadata: appMetadata,
          },
        })
      );
    } catch (error) {
      console.warn('Failed to add WalletConnect fallback:', error);
    }
  }
}

// Ensure we have at least one connector before creating config
// If no connectors, create a minimal config with MetaMask only
const finalConnectors = connectors.length > 0 ? connectors : [
  // Fallback: add MetaMask as minimal connector (should always work)
  new MetaMaskConnector({
    chains: [targetChain],
    options: {
      shimDisconnect: true,
    },
  })
];

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors: finalConnectors,
  transports: {
    [targetChain.id]: http(rpcUrl),
  },
});
