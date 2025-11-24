import { useAccount, useNetwork } from 'wagmi';
import { celo } from 'wagmi/chains';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';

// Always use Celo mainnet
const TARGET_CHAIN_ID = celo.id; // 42220

export const useChainManager = () => {
  const { isConnected, connector } = useAccount();
  const { chain } = useNetwork();
  const wagmiChainId = chain?.id;
  const [chainId, setChainId] = useState<number | undefined>(wagmiChainId);
  const [isSwitching, setIsSwitching] = useState(false);

  // Sync chainId from wagmi, with fallback to provider
  useEffect(() => {
    if (wagmiChainId) {
      setChainId(wagmiChainId);
      return;
    }

    // Fallback: get chainId from provider if wagmi doesn't have it
    if (isConnected && connector) {
      let provider: any = null;
      let cleanupFn: (() => void) | null = null;

      const setup = async () => {
        try {
          // Try to get provider from connector
          if (connector && typeof connector.getProvider === 'function') {
            try {
              provider = await connector.getProvider();
            } catch (e) {
              // Ignore
            }
          }

          // Fallback to window.ethereum
          if (!provider && window.ethereum) {
            provider = window.ethereum;
          }

          if (provider && typeof provider.request === 'function') {
            const id = await provider.request({ method: 'eth_chainId' });
            setChainId(Number(id));
          }

          // Set up chain change listener (only once)
          if (provider && provider.on) {
            const handleChainChanged = (chainIdHex: string) => {
              console.log('Chain changed event:', chainIdHex);
              setChainId(Number(chainIdHex));
            };

            // Remove any existing listener first
            if (provider.removeListener) {
              provider.removeListener('chainChanged', handleChainChanged);
            }

            provider.on('chainChanged', handleChainChanged);

            cleanupFn = () => {
              if (provider?.removeListener) {
                provider.removeListener('chainChanged', handleChainChanged);
              }
            };
          }
        } catch (error) {
          console.error('Failed to setup chain listener:', error);
        }
      };

      setup();

      return () => {
        if (cleanupFn) {
          cleanupFn();
        }
      };
    } else if (!isConnected) {
      setChainId(undefined);
    }
  }, [isConnected, wagmiChainId, connector]);

  // Use chainId from wagmi's useAccount hook or fallback
  const isOnCorrectChain = chainId === TARGET_CHAIN_ID;
  const targetChain = celo;

  // Auto-switch chain if connected but on wrong chain (attempt once)
  useEffect(() => {
    if (isConnected && chainId !== undefined && !isOnCorrectChain && !isSwitching) {
      // We use a timeout to avoid immediate conflicts with connection logic
      const timer = setTimeout(() => {
        ensureCorrectChain();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, chainId, isOnCorrectChain, isSwitching]);

  const ensureCorrectChain = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (isOnCorrectChain) {
      return true;
    }

    setIsSwitching(true);
    try {
      toast.info(`Switching to ${targetChain.name}...`);

      // Get the best available provider
      let provider: any = null;

      // 1. Try window.farcaster.wallet first if in Farcaster context
      if (typeof window !== 'undefined' && window.farcaster?.wallet) {
        provider = window.farcaster.wallet;
      }

      // 2. Try getting provider from connector
      if (!provider && connector) {
        try {
          if (typeof connector.getProvider === 'function') {
            provider = await connector.getProvider();
          } else if ((connector as any).provider) {
            provider = (connector as any).provider;
          }
        } catch (e) {
          console.warn('Failed to get provider from connector:', e);
        }
      }

      // 3. Fallback to window.ethereum
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        provider = window.ethereum;
      }

      if (!provider) {
        throw new Error('No wallet provider found');
      }

      // If we have a provider, use it to switch chains
      if (provider && typeof provider.request === 'function') {
        try {
          const celoChainId = `0x${TARGET_CHAIN_ID.toString(16)}`;

          // Try to switch chain
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: celoChainId }],
          });

          // Wait for chain to actually switch
          // We'll poll for a bit to ensure the switch happened
          let retries = 0;
          while (retries < 5) {
            const currentChainId = await provider.request({ method: 'eth_chainId' });
            if (Number(currentChainId) === TARGET_CHAIN_ID) {
              setChainId(TARGET_CHAIN_ID);
              toast.success(`Switched to ${targetChain.name}`);
              return true;
            }
            await new Promise(r => setTimeout(r, 1000));
            retries++;
          }

          // If we're here, we might have timed out, but let's assume it might still happen
          // or the user needs to approve.
          return true;

        } catch (switchError: any) {
          // If chain doesn't exist (error code 4902), try to add it
          if (switchError.code === 4902) {
            const celoChainId = `0x${TARGET_CHAIN_ID.toString(16)}`;

            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: celoChainId,
                  chainName: targetChain.name,
                  nativeCurrency: {
                    name: 'CELO',
                    symbol: 'CELO',
                    decimals: 18,
                  },
                  rpcUrls: targetChain.rpcUrls.default.http,
                  blockExplorerUrls: targetChain.blockExplorers
                    ? [targetChain.blockExplorers.default.url]
                    : [],
                },
              ],
            });

            // Update state after adding
            setChainId(TARGET_CHAIN_ID);
            toast.success(`Added and switched to ${targetChain.name}`);
            return true;
          }
          throw switchError;
        }
      }

      // If we get here, we couldn't switch
      toast.error('Unable to switch chain automatically. Please switch to Celo manually in your wallet.');
      return false;
    } catch (error: any) {
      console.error('Chain switch error:', error);
      const message = error instanceof Error ? error.message : 'Failed to switch chain';
      // Don't show error for user rejection
      if (!message.includes('rejected') && !message.includes('User rejected')) {
        toast.error(`Chain switch failed: ${message}`);
      }
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [isConnected, isOnCorrectChain, targetChain, connector]);

  return {
    chainId,
    isOnCorrectChain,
    isSwitching,
    targetChain,
    ensureCorrectChain,
  };
};

