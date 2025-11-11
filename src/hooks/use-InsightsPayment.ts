import { useCallback, useMemo, useState, useEffect } from "react";
import { parseUnits, createWalletClient, custom, http } from "viem";
import { useAccount } from "wagmi";
import { celo } from "wagmi/chains";

import InsightsPaymentArtifact from "@/lib/InsightsPayment.json";
import {
  INSIGHTS_PAYMENT_ADDRESS,
} from "@/lib/contractConfig";
import { publicClient } from "@/lib/contract";

const CHECKIN_FEE = parseUnits("0.1", 18);

type SubscriptionStatus = {
  isSubscribed: boolean;
  subscriptionExpiry: number;
  isInCooldown: boolean;
  lastCheckin: number;
  hoursUntilNextCheckin: number;
  cooldownRemainingSeconds: number; // For displaying precise countdown
  checkinCount: number;
  checkinsUntilReward: number;
  nextRewardAt: number; // Check-in number when next reward will be given
  dailyCheckinCount: number; // Number of check-ins today (0-2)
  remainingCheckinsToday: number; // Remaining check-ins available today (0-2)
};

const defaultStatus: SubscriptionStatus = {
  isSubscribed: false,
  subscriptionExpiry: 0,
  isInCooldown: false,
  lastCheckin: 0,
  hoursUntilNextCheckin: 0,
  cooldownRemainingSeconds: 0,
  checkinCount: 0,
  checkinsUntilReward: 5,
  nextRewardAt: 5,
  dailyCheckinCount: 0,
  remainingCheckinsToday: 2,
};

export const useInsightsPayment = (fallbackCheckInCount?: number) => {
  const { address, isConnected, connector } = useAccount();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  // Get wallet client dynamically when needed to avoid chain initialization issues
  // Don't use useWalletClient hook as it requires chain to be initialized
  const getWalletClient = useCallback(async () => {
    // Try to get provider from connector
    let provider: any = null;
    
    if (connector && typeof connector.getProvider === 'function') {
      try {
        provider = await connector.getProvider();
      } catch (e) {
        console.warn('Failed to get provider from connector:', e);
      }
    }
    
    // Fallback to window.ethereum if connector provider not available
    if (!provider && typeof window !== 'undefined' && window.ethereum) {
      provider = window.ethereum;
    }
    
    // If we still don't have a provider, try to get it from the connector's internal state
    if (!provider && connector) {
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
    
    if (!provider) {
      return null;
    }
    
    try {
      return createWalletClient({
        chain: celo,
        transport: custom(provider),
      });
    } catch (error) {
      console.error('Failed to create wallet client:', error);
      return null;
    }
  }, [connector]);
  
  // Get account for the wallet client - use the connected address
  const getAccount = useCallback(() => {
    if (!address) return null;
    // Return account object with the connected address
    return { address: address as `0x${string}` };
  }, [address]);
  
  // State for contract data
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<number>(0);
  const [isInCooldown, setIsInCooldown] = useState<boolean>(false);
  const [lastCheckinTimestamp, setLastCheckinTimestamp] = useState<number>(0);
  const [checkinCount, setCheckinCount] = useState<number>(0);
  const [checkinsUntilReward, setCheckinsUntilReward] = useState<number>(5);
  const [dailyCheckinCount, setDailyCheckinCount] = useState<number>(0);
  const [remainingCheckinsToday, setRemainingCheckinsToday] = useState<number>(2);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [localCooldownRemaining, setLocalCooldownRemaining] = useState<number>(0);

  // Refetch function - defined early to avoid hoisting issues
  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // Real-time countdown timer for cooldown
  useEffect(() => {
    if (!address || !isInCooldown || lastCheckinTimestamp === 0) {
      setLocalCooldownRemaining(0);
      return;
    }

    // Calculate cooldown end time
    const cooldownEnd = lastCheckinTimestamp + 5 * 60 * 60; // 5 hours in seconds
    
    // Update countdown every second
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, cooldownEnd - now);
      setLocalCooldownRemaining(remaining);
      
      // If cooldown expired, trigger a refetch
      if (remaining === 0) {
        setRefetchTrigger((prev) => prev + 1);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [address, isInCooldown, lastCheckinTimestamp]);

  // Fetch contract data using publicClient (more reliable than useContractRead)
  useEffect(() => {
    if (!address) {
      setIsSubscribed(false);
      setSubscriptionExpiry(0);
      setIsInCooldown(false);
      setLastCheckinTimestamp(0);
      setCheckinCount(0);
      setCheckinsUntilReward(5);
      setDailyCheckinCount(0);
      setRemainingCheckinsToday(2);
      setCooldownRemaining(0);
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        // Core functions that should always exist
        const [subscribed, expiry, cooldown, lastCheckin, cooldownRemainingSeconds, dailyCount, remainingToday] = await Promise.all([
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "isSubscribed",
            args: [address],
          }).catch(() => false),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getSubscriptionExpiry",
            args: [address],
          }).catch(() => 0n),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "isInCooldown",
            args: [address],
          }).catch(() => false),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "lastCheckin",
            args: [address],
          }).catch(() => 0n),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getCooldownRemaining",
            args: [address],
          }).catch(() => 0n),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getDailyCheckinCount",
            args: [address],
          }).catch(() => 0n),
          publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getRemainingCheckinsToday",
            args: [address],
          }).catch(() => 2n),
        ]);

        setIsSubscribed(subscribed as boolean);
        setSubscriptionExpiry(Number(expiry));
        setIsInCooldown(cooldown as boolean);
        setLastCheckinTimestamp(Number(lastCheckin));
        setCooldownRemaining(Number(cooldownRemainingSeconds));
        setDailyCheckinCount(Number(dailyCount));
        setRemainingCheckinsToday(Number(remainingToday));

        // New functions that may not exist in old contracts - use defaults if missing
        let contractCountAvailable = false;
        try {
          const count = await publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getCheckinCount",
            args: [address],
          });
          const countNumber = Number(count);
          setCheckinCount(countNumber);
          contractCountAvailable = true;
        } catch (error) {
          // Function doesn't exist in old contract - will use fallback from React state
          // Silently fail - don't spam console
          contractCountAvailable = false;
        }
        
        // Use fallback count if contract function doesn't exist or failed
        if (!contractCountAvailable && fallbackCheckInCount !== undefined) {
          setCheckinCount(fallbackCheckInCount);
        }

        try {
          const untilReward = await publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getCheckinsUntilReward",
            args: [address],
          });
          setCheckinsUntilReward(Number(untilReward));
        } catch (error) {
          // Function doesn't exist in old contract - calculate from checkinCount
          // Will be calculated in status memo below
        }
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        // Set defaults on error
        setIsSubscribed(false);
        setSubscriptionExpiry(0);
        setIsInCooldown(false);
        setLastCheckinTimestamp(0);
        setCheckinCount(0);
        setCheckinsUntilReward(5);
        setDailyCheckinCount(0);
        setRemainingCheckinsToday(2);
        setCooldownRemaining(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [address, refetchTrigger, fallbackCheckInCount]);

  // Refetch function is defined above to avoid hoisting issues

  const status: SubscriptionStatus = useMemo(() => {
    if (!address) {
      return defaultStatus;
    }

    const cooldown = isInCooldown;
    const lastCheckinValue = lastCheckinTimestamp;
    
    // Calculate hours until next check-in (5 hour cooldown)
    // Use local countdown if available (real-time), otherwise use contract value
    let hoursUntilNextCheckin = 0;
    const effectiveCooldownRemaining = localCooldownRemaining > 0 ? localCooldownRemaining : cooldownRemaining;
    
    if (effectiveCooldownRemaining > 0) {
      // Show hours and minutes for better UX
      const totalHours = effectiveCooldownRemaining / 3600;
      hoursUntilNextCheckin = Math.max(0, Math.ceil(totalHours));
    } else if (cooldown && lastCheckinValue > 0) {
      // Fallback calculation if cooldownRemaining not available
      const cooldownEnd = lastCheckinValue + 5 * 60 * 60; // 5 hours in seconds
      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = cooldownEnd - now;
      hoursUntilNextCheckin = Math.max(0, Math.ceil(secondsRemaining / 3600));
    }

    // Calculate next reward checkpoint (5, 10, 15, 20, etc.)
    const nextRewardAt = checkinCount === 0 ? 5 : Math.ceil((checkinCount + 1) / 5) * 5;
    
    // Calculate checkinsUntilReward if not available from contract
    // Formula: (5 - (count % 5)) % 5 gives us remaining check-ins until next reward
    // If count is 0, we need 5 more. If count is 5, we need 5 more (next reward at 10)
    const calculatedUntilReward = checkinCount === 0 
      ? 5 
      : (5 - (checkinCount % 5)) % 5 || 5; // If divisible by 5, next reward is at next 5

    // Use contract value if available, otherwise use calculated value
    const finalCheckinsUntilReward = checkinsUntilReward === 5 && checkinCount > 0 
      ? calculatedUntilReward 
      : checkinsUntilReward;

    return {
      isSubscribed,
      subscriptionExpiry,
      isInCooldown: cooldown,
      lastCheckin: lastCheckinValue,
      hoursUntilNextCheckin,
      checkinCount,
      checkinsUntilReward: finalCheckinsUntilReward,
      nextRewardAt,
      dailyCheckinCount,
      remainingCheckinsToday,
      cooldownRemainingSeconds: effectiveCooldownRemaining,
    };
  }, [address, isSubscribed, subscriptionExpiry, isInCooldown, lastCheckinTimestamp, checkinCount, checkinsUntilReward, dailyCheckinCount, remainingCheckinsToday, cooldownRemaining, localCooldownRemaining]);


  const submitCheckin = useCallback(
    async (ipfsHash: string, requiresFee: boolean) => {
      if (!address) throw new Error("Wallet not connected");
      if (!isConnected) throw new Error("Wallet not connected");
      
      // CRITICAL: Ensure we're on Celo network BEFORE attempting any transaction
      // Get provider from connector or window.ethereum
      let provider: any = null;
      
      if (connector && typeof connector.getProvider === 'function') {
        try {
          provider = await connector.getProvider();
        } catch (e) {
          console.warn('Failed to get provider from connector:', e);
        }
      }
      
      if (!provider && typeof window !== 'undefined' && window.ethereum) {
        provider = window.ethereum;
      }
      
      if (!provider) {
        throw new Error("Wallet provider not available. Please ensure your wallet is connected.");
      }
      
      try {
        const celoChainId = `0x${celo.id.toString(16)}`; // Convert to hex (0xa4ec)
        let currentChainId: string;
        
        // Get current chain ID from provider
        if (provider.request) {
          currentChainId = await provider.request({ method: 'eth_chainId' });
        } else if (provider.chainId) {
          currentChainId = typeof provider.chainId === 'number' 
            ? `0x${provider.chainId.toString(16)}` 
            : provider.chainId;
        } else {
          throw new Error("Cannot determine current chain. Please switch to Celo network manually.");
        }
        
        // If not on Celo, attempt to switch
        if (currentChainId !== celoChainId) {
          console.log(`Current chain: ${currentChainId}, Required: ${celoChainId}. Attempting to switch...`);
          
          try {
            // Try to switch to Celo
            if (provider.request) {
              try {
                await provider.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: celoChainId }],
                });
              } catch (switchError: any) {
                // If chain doesn't exist (error code 4902), add it
                if (switchError.code === 4902) {
                  console.log('Celo network not found in wallet. Adding it...');
                  await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: celoChainId,
                      chainName: celo.name,
                      nativeCurrency: {
                        name: 'CELO',
                        symbol: 'CELO',
                        decimals: 18,
                      },
                      rpcUrls: celo.rpcUrls.default.http,
                      blockExplorerUrls: celo.blockExplorers ? [celo.blockExplorers.default.url] : [],
                    }],
                  });
                  // Wait a bit for chain to be added
                  await new Promise(resolve => setTimeout(resolve, 2000));
                } else if (switchError.code === 4001) {
                  // User rejected the request
                  throw new Error('Chain switch was rejected. Please switch to Celo network (chain ID: 42220) manually.');
                } else {
                  throw switchError;
                }
              }
            }
            
            // Wait for chain to actually switch (with improved timeout and polling)
            let switched = false;
            const maxWaitTime = 20000; // 20 seconds total
            const pollInterval = 500; // Poll every 500ms
            const startTime = Date.now();
            
            // Set up event listener if available
            let chainChangedHandler: ((newChainId: string) => void) | null = null;
            
            if (provider?.on) {
              chainChangedHandler = (newChainId: string) => {
                const chainIdNum = typeof newChainId === 'string' ? newChainId : `0x${Number(newChainId).toString(16)}`;
                if (chainIdNum === celoChainId) {
                  switched = true;
                  if (provider?.removeListener && chainChangedHandler) {
                    provider.removeListener('chainChanged', chainChangedHandler);
                  }
                }
              };
              provider.on('chainChanged', chainChangedHandler);
            }
            
            // Poll for chain change (works even if events don't fire)
            while (!switched && (Date.now() - startTime) < maxWaitTime) {
              try {
                let newChainId: string;
                if (provider.request) {
                  newChainId = await provider.request({ method: 'eth_chainId' });
                } else if (provider.chainId) {
                  newChainId = typeof provider.chainId === 'number' 
                    ? `0x${provider.chainId.toString(16)}` 
                    : provider.chainId;
                } else {
                  break; // Can't determine chain
                }
                
                // Normalize chain ID format
                const normalizedNew = typeof newChainId === 'string' && newChainId.startsWith('0x') 
                  ? newChainId.toLowerCase() 
                  : `0x${Number(newChainId).toString(16)}`;
                const normalizedCelo = celoChainId.toLowerCase();
                
                if (normalizedNew === normalizedCelo) {
                  switched = true;
                  break;
                }
              } catch (e) {
                console.warn('Error checking chain ID:', e);
              }
              
              // Wait before next poll
              await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
            
            // Clean up event listener
            if (chainChangedHandler && provider?.removeListener) {
              try {
                provider.removeListener('chainChanged', chainChangedHandler);
              } catch (e) {
                // Ignore cleanup errors
              }
            }
            
            if (!switched) {
              // Final check before giving up
              let finalChainId: string;
              try {
                if (provider.request) {
                  finalChainId = await provider.request({ method: 'eth_chainId' });
                } else if (provider.chainId) {
                  finalChainId = typeof provider.chainId === 'number' 
                    ? `0x${provider.chainId.toString(16)}` 
                    : provider.chainId;
                } else {
                  throw new Error('Cannot determine chain ID');
                }
                
                const normalizedFinal = typeof finalChainId === 'string' && finalChainId.startsWith('0x')
                  ? finalChainId.toLowerCase()
                  : `0x${Number(finalChainId).toString(16)}`;
                const normalizedCelo = celoChainId.toLowerCase();
                
                if (normalizedFinal === normalizedCelo) {
                  switched = true;
                }
              } catch (e) {
                // Ignore final check errors
              }
            }
            
            if (!switched) {
              throw new Error('Chain switch timeout. Please switch to Celo network (chain ID: 42220) manually in your wallet and try again.');
            }
            
            console.log('Successfully switched to Celo network');
          } catch (switchError: any) {
            // Re-throw with clearer message
            if (switchError.message && switchError.message.includes('timeout')) {
              throw switchError;
            } else if (switchError.code === 4001) {
              throw new Error('Chain switch was rejected. Please switch to Celo network (chain ID: 42220) manually.');
            } else {
              throw new Error(`Failed to switch to Celo network: ${switchError.message || switchError}. Please switch to Celo (chain ID: 42220) manually in your wallet.`);
            }
          }
        }
      } catch (error) {
        console.error('Failed to ensure Celo network:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Cannot proceed with transaction: ${errorMessage}. Please switch to Celo network (chain ID: 42220) and try again.`);
      }
      
      // Create wallet client after ensuring we're on Celo
      const walletClient = await getWalletClient();
      if (!walletClient) {
        throw new Error("Wallet client not available. Please ensure your wallet is connected.");
      }

      // Get account for the transaction
      const account = getAccount();
      if (!account) {
        throw new Error("Account not available. Please ensure your wallet is connected.");
      }

      setIsProcessing(true);
      try {
        // Use walletClient.writeContract with account and explicit chain to ensure CELO
        const hash = await walletClient.writeContract({
          account: account.address,
          address: INSIGHTS_PAYMENT_ADDRESS,
          abi: InsightsPaymentArtifact.abi,
          functionName: "submitCheckin",
          args: [ipfsHash],
          value: requiresFee ? CHECKIN_FEE : undefined,
          chain: celo, // Explicitly set chain to ensure CELO is used
        });
        
        await publicClient.waitForTransactionReceipt({ hash });
        
        // Wait a bit for contract state to propagate, then refetch
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refetch();
        
        // Refetch again after a longer delay to ensure state is updated
        setTimeout(() => {
          refetch();
        }, 5000);
        
        return hash;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
            throw new Error("Transaction rejected by user");
          }
          // Check for connector/wallet errors (common in Safari)
          if (error.message.includes('Connector not found') || error.message.includes('not found')) {
            const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
              throw new Error("Wallet not found. In Safari, please ensure MetaMask is installed and enabled, or use WalletConnect to connect a mobile wallet.");
            }
            throw new Error("Wallet not found. Please connect your wallet and try again.");
          }
          // Check for account errors
          if (error.message.includes('Account') || error.message.includes('account')) {
            throw new Error("Account not available. Please reconnect your wallet and try again.");
          }
          throw error;
        }
        throw new Error("Failed to submit check-in. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [address, isConnected, getWalletClient, getAccount, refetch]
  );

  // Check cooldown and daily limit
  const checkCooldown = useCallback(async (): Promise<boolean> => {
    if (!address) return false;
    
    try {
      // Check if in cooldown
      const inCooldown = await publicClient.readContract({
        address: INSIGHTS_PAYMENT_ADDRESS,
        abi: InsightsPaymentArtifact.abi,
        functionName: "isInCooldown",
        args: [address],
      }).catch((err) => {
        console.warn("Failed to check isInCooldown, assuming false:", err);
        return false; // If function doesn't exist, assume not in cooldown
      });
      
      // Check remaining check-ins today
      const remaining = await publicClient.readContract({
        address: INSIGHTS_PAYMENT_ADDRESS,
        abi: InsightsPaymentArtifact.abi,
        functionName: "getRemainingCheckinsToday",
        args: [address],
      }).catch((err) => {
        console.warn("Failed to check getRemainingCheckinsToday, assuming 2:", err);
        return 2n; // If function doesn't exist, assume full allowance
      });
      
      console.log("Contract check result:", {
        inCooldown,
        remaining: Number(remaining),
        canCheckIn: !inCooldown && Number(remaining) > 0
      });
      
      // Can check in if not in cooldown AND has remaining check-ins
      return !inCooldown && Number(remaining) > 0;
    } catch (error) {
      console.error("Failed to check cooldown:", error);
      // On error, allow check-in attempt (contract will enforce)
      return true;
    }
  }, [address]);


  return {
    status,
    isLoading,
    isProcessing,
    submitCheckin,
    checkCooldown,
    refetchStatus: refetch,
  };
};
