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

  // Sync chainId from wagmi, with fallback to window.ethereum
  useEffect(() => {
    if (wagmiChainId) {
      setChainId(wagmiChainId);
      return;
    }

    // Fallback: get chainId from window.ethereum if wagmi doesn't have it
    if (isConnected && window.ethereum) {
      const fetchChainId = async () => {
        try {
          const id = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(Number(id));
        } catch (error) {
          console.error('Failed to get chainId:', error);
        }
      };
      fetchChainId();

      const handleChainChanged = (chainIdHex: string) => {
        setChainId(Number(chainIdHex));
      };

      if (window.ethereum.on) {
        window.ethereum.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    } else if (!isConnected) {
      setChainId(undefined);
    }
  }, [isConnected, wagmiChainId]);

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

    if (!window.ethereum) {
      toast.error('Wallet provider not available');
      return false;
    }

    setIsSwitching(true);
    try {
      toast.info(`Switching to ${targetChain.name}...`);
      
      // Try to switch chain using window.ethereum
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
        });
        toast.success(`Switched to ${targetChain.name}`);
        return true;
      } catch (switchError: any) {
        // If chain doesn't exist (error code 4902), try to add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                chainName: targetChain.name,
                nativeCurrency: targetChain.nativeCurrency,
                rpcUrls: targetChain.rpcUrls.default.http,
                blockExplorerUrls: targetChain.blockExplorers
                  ? [targetChain.blockExplorers.default.url]
                  : [],
              },
            ],
          });
          toast.success(`Added and switched to ${targetChain.name}`);
          return true;
        }
        throw switchError;
      }
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
  }, [isConnected, isOnCorrectChain, targetChain]);

  return {
    chainId,
    isOnCorrectChain,
    isSwitching,
    targetChain,
    ensureCorrectChain,
  };
};

