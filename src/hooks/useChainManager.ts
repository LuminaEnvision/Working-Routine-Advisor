import { useAccount } from 'wagmi';
import { celo } from 'wagmi/chains';
import { toast } from 'sonner';
import { useCallback, useState, useEffect } from 'react';

// Always use Celo mainnet
const TARGET_CHAIN_ID = celo.id; // 42220

export const useChainManager = () => {
  const { isConnected, connector, chainId: wagmiChainId } = useAccount();
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
      const fetchChainId = async () => {
        try {
          let provider: any = null;
          
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
        } catch (error) {
          console.error('Failed to get chainId:', error);
        }
      };
      
      fetchChainId();
      
      // Set up chain change listener
      const setupListener = async () => {
        try {
          let provider: any = null;
          
          if (connector && typeof connector.getProvider === 'function') {
            try {
              provider = await connector.getProvider();
            } catch (e) {
              // Ignore
            }
          }
          
          if (!provider && window.ethereum) {
            provider = window.ethereum;
          }
          
          if (provider && provider.on) {
            const handleChainChanged = (chainIdHex: string) => {
              setChainId(Number(chainIdHex));
            };
            
            provider.on('chainChanged', handleChainChanged);
            
            return () => {
              if (provider?.removeListener) {
                provider.removeListener('chainChanged', handleChainChanged);
              }
            };
          }
        } catch (e) {
          // Ignore
        }
      };
      
      const cleanup = setupListener();
      
      return () => {
        cleanup.then(cleanupFn => cleanupFn?.());
      };
    } else if (!isConnected) {
      setChainId(undefined);
    }
  }, [isConnected, wagmiChainId, connector]);

  // Use chainId from wagmi's useAccount hook or fallback
  const isOnCorrectChain = chainId === TARGET_CHAIN_ID;
  const targetChain = celo;

  const ensureCorrectChain = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (isOnCorrectChain) {
      return true;
    }

    if (!connector) {
      toast.error('Wallet connector not available');
      return false;
    }

    setIsSwitching(true);
    try {
      toast.info(`Switching to ${targetChain.name}...`);
      
      // Try to get provider from connector
      let provider: any = null;
      
      try {
        // Try to get provider from connector
        if (connector && typeof connector.getProvider === 'function') {
          provider = await connector.getProvider();
        }
      } catch (e) {
        console.warn('Failed to get provider from connector:', e);
      }

      // Fallback to window.ethereum if connector provider not available
      if (!provider && window.ethereum) {
        provider = window.ethereum;
      }

      // If we still don't have a provider, try to get it from the connector's internal state
      if (!provider && connector) {
        // Some connectors expose provider differently
        try {
          const connectorAny = connector as any;
          if (connectorAny.provider) {
            provider = connectorAny.provider;
          } else if (connectorAny.getProvider) {
            provider = await connectorAny.getProvider();
          }
        } catch (e) {
          console.warn('Failed to get provider from connector internal state:', e);
        }
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
          
          // Wait for chain to actually switch and verify
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Chain switch timeout'));
            }, 10000); // 10 second timeout
            
            const checkChain = async () => {
              try {
                const currentChainId = await provider.request({ method: 'eth_chainId' });
                if (currentChainId === celoChainId) {
                  clearTimeout(timeout);
                  if (provider.removeListener) {
                    provider.removeListener('chainChanged', handleChainChanged);
                  }
                  // Update chain ID immediately
                  setChainId(TARGET_CHAIN_ID);
                  resolve();
                }
              } catch (e) {
                // If we can't check, wait a bit and try again
                setTimeout(checkChain, 500);
              }
            };
            
            const handleChainChanged = (newChainId: string) => {
              clearTimeout(timeout);
              if (provider.removeListener) {
                provider.removeListener('chainChanged', handleChainChanged);
              }
              const chainIdNum = Number(newChainId);
              setChainId(chainIdNum);
              if (chainIdNum === TARGET_CHAIN_ID) {
                resolve();
              } else {
                reject(new Error('Chain switch failed'));
              }
            };
            
            // Listen for chain change event
            if (provider.on) {
              provider.on('chainChanged', handleChainChanged);
            }
            
            // Also poll the chain ID in case events don't fire
            setTimeout(checkChain, 500);
            setTimeout(checkChain, 1500);
            setTimeout(checkChain, 3000);
          });
          
          toast.success(`Switched to ${targetChain.name}`);
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
            
            // Wait for chain to switch after adding
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Chain switch timeout'));
              }, 10000);
              
              const checkChain = async () => {
                try {
                  const currentChainId = await provider.request({ method: 'eth_chainId' });
                  if (currentChainId === celoChainId) {
                    clearTimeout(timeout);
                    setChainId(TARGET_CHAIN_ID);
                    resolve();
                  }
                } catch (e) {
                  setTimeout(checkChain, 500);
                }
              };
              
              const handleChainChanged = (newChainId: string) => {
                clearTimeout(timeout);
                if (provider.removeListener) {
                  provider.removeListener('chainChanged', handleChainChanged);
                }
                const chainIdNum = Number(newChainId);
                setChainId(chainIdNum);
                if (chainIdNum === TARGET_CHAIN_ID) {
                  resolve();
                } else {
                  reject(new Error('Chain switch failed'));
                }
              };
              
              if (provider.on) {
                provider.on('chainChanged', handleChainChanged);
              }
              
              setTimeout(checkChain, 500);
              setTimeout(checkChain, 1500);
              setTimeout(checkChain, 3000);
            });
            
            toast.success(`Added and switched to ${targetChain.name}`);
            return true;
          }
          throw switchError;
        }
      }

      // If we get here, we couldn't switch
      toast.error('Unable to switch chain. Please switch to Celo manually in your wallet.');
      return false;
    } catch (error: any) {
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

