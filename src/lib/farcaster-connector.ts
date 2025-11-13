import { getFarcasterWalletProvider, isFarcasterMiniApp, isFarcasterWalletAvailable } from './farcaster-miniapp';
import { InjectedConnector } from 'wagmi/connectors/injected';

/**
 * Farcaster Mini App Wallet Connector
 * This connector uses Farcaster's embedded wallet when running inside Farcaster
 * The wallet provider is EIP-1193 compatible, so we can use it with wagmi
 */
export const createFarcasterConnector = (chains: any[]) => {
  // Check if we're in Farcaster context
  if (!isFarcasterMiniApp()) {
    return null; // Not in Farcaster context
  }

  // Use InjectedConnector with Farcaster provider
  // The provider will be resolved asynchronously when needed
  return new InjectedConnector({
    chains,
    options: {
      name: 'Farcaster Wallet',
      shimDisconnect: true,
      getProvider: async () => {
        try {
          // First check if wallet is available
          const isAvailable = await isFarcasterWalletAvailable();
          if (!isAvailable) {
            console.warn('Farcaster wallet not available yet, retrying...');
            // Wait a bit and retry (wallet might still be initializing)
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          const provider = await getFarcasterWalletProvider();
          if (!provider) {
            throw new Error('Farcaster wallet provider not available. Make sure you are running inside Farcaster/Warpcast.');
          }
          
          // Verify it's a valid EIP-1193 provider
          if (typeof provider.request !== 'function') {
            throw new Error('Farcaster wallet provider is not EIP-1193 compatible');
          }
          
          return provider;
        } catch (error) {
          console.error('Failed to get Farcaster wallet provider:', error);
          throw error;
        }
      },
    },
  });
};
