import { getFarcasterWalletProvider, isFarcasterMiniApp } from './farcaster-miniapp';
import { InjectedConnector } from 'wagmi/connectors/injected';

/**
 * Farcaster Mini App Wallet Connector
 * This connector uses Farcaster's embedded wallet when running inside Farcaster
 * The wallet provider is EIP-1193 compatible, so we can use it with wagmi
 */
export const createFarcasterConnector = (chains: any[]) => {
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
        const provider = await getFarcasterWalletProvider();
        if (!provider) {
          throw new Error('Farcaster wallet provider not available');
        }
        return provider;
      },
    },
  });
};
