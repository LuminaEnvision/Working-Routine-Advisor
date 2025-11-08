import { useCallback, useMemo, useState, useEffect } from "react";
import { parseUnits } from "viem";
import { useAccount, useContractWrite } from "wagmi";

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
  checkinCount: number;
  checkinsUntilReward: number;
  nextRewardAt: number; // Check-in number when next reward will be given
};

const defaultStatus: SubscriptionStatus = {
  isSubscribed: false,
  subscriptionExpiry: 0,
  isInCooldown: false,
  lastCheckin: 0,
  hoursUntilNextCheckin: 0,
  checkinCount: 0,
  checkinsUntilReward: 5,
  nextRewardAt: 5,
};

export const useInsightsPayment = () => {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  // State for contract data
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<number>(0);
  const [isInCooldown, setIsInCooldown] = useState<boolean>(false);
  const [lastCheckinTimestamp, setLastCheckinTimestamp] = useState<number>(0);
  const [checkinCount, setCheckinCount] = useState<number>(0);
  const [checkinsUntilReward, setCheckinsUntilReward] = useState<number>(5);

  // Fetch contract data using publicClient (more reliable than useContractRead)
  useEffect(() => {
    if (!address) {
      setIsSubscribed(false);
      setSubscriptionExpiry(0);
      setIsInCooldown(false);
      setLastCheckinTimestamp(0);
      setCheckinCount(0);
      setCheckinsUntilReward(5);
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        // Core functions that should always exist
        const [subscribed, expiry, cooldown, lastCheckin] = await Promise.all([
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
        ]);

        setIsSubscribed(subscribed as boolean);
        setSubscriptionExpiry(Number(expiry));
        setIsInCooldown(cooldown as boolean);
        setLastCheckinTimestamp(Number(lastCheckin));

        // New functions that may not exist in old contracts - use defaults if missing
        try {
          const count = await publicClient.readContract({
            address: INSIGHTS_PAYMENT_ADDRESS,
            abi: InsightsPaymentArtifact.abi,
            functionName: "getCheckinCount",
            args: [address],
          });
          setCheckinCount(Number(count));
        } catch (error) {
          // Function doesn't exist in old contract - use default
          setCheckinCount(0);
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
          // Function doesn't exist in old contract - use default
          setCheckinsUntilReward(5);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [address, refetchTrigger]);

  // Write contract functions - use writeAsync for better error handling
  const { writeAsync: writeCheckin, isLoading: isCheckingIn } = useContractWrite({
    address: INSIGHTS_PAYMENT_ADDRESS,
    abi: InsightsPaymentArtifact.abi,
    functionName: "submitCheckin",
  });

  // Refetch all data
  const refetch = useCallback(async () => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const status: SubscriptionStatus = useMemo(() => {
    if (!address) {
      return defaultStatus;
    }

    const cooldown = isInCooldown;
    const lastCheckinValue = lastCheckinTimestamp;
    
    // Calculate hours until next check-in
    let hoursUntilNextCheckin = 0;
    if (cooldown && lastCheckinValue > 0) {
      const cooldownEnd = lastCheckinValue + 24 * 60 * 60; // 24 hours in seconds
      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = cooldownEnd - now;
      hoursUntilNextCheckin = Math.max(0, Math.ceil(secondsRemaining / 3600));
    }

    // Calculate next reward checkpoint (5, 10, 15, 20, etc.)
    const nextRewardAt = checkinCount === 0 ? 5 : Math.ceil((checkinCount + 1) / 5) * 5;

    return {
      isSubscribed,
      subscriptionExpiry,
      isInCooldown: cooldown,
      lastCheckin: lastCheckinValue,
      hoursUntilNextCheckin,
      checkinCount,
      checkinsUntilReward,
      nextRewardAt,
    };
  }, [address, isSubscribed, subscriptionExpiry, isInCooldown, lastCheckinTimestamp, checkinCount, checkinsUntilReward]);

  // Update isProcessing based on write states
  useEffect(() => {
    setIsProcessing(isCheckingIn);
  }, [isCheckingIn]);


  const submitCheckin = useCallback(
    async (ipfsHash: string, requiresFee: boolean) => {
      if (!address) throw new Error("Wallet not connected");
      if (!writeCheckin) throw new Error("Checkin function not available");

      try {
        const hash = await writeCheckin({
          args: [ipfsHash],
          value: requiresFee ? CHECKIN_FEE : undefined,
        });
        await publicClient.waitForTransactionReceipt({ hash });
        await refetch();
        return hash;
      } catch (error) {
        throw error;
      }
    },
    [address, writeCheckin, refetch]
  );

  const checkCooldown = useCallback(async (): Promise<boolean> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      const inCooldown = await publicClient.readContract({
        address: INSIGHTS_PAYMENT_ADDRESS,
        abi: InsightsPaymentArtifact.abi,
        functionName: "isInCooldown",
        args: [address],
      });

      if (inCooldown) {
        const lastCheckin = await publicClient.readContract({
          address: INSIGHTS_PAYMENT_ADDRESS,
          abi: InsightsPaymentArtifact.abi,
          functionName: "lastCheckin",
          args: [address],
        });

        const cooldownEnd = Number(lastCheckin) + 24 * 60 * 60; // 24 hours
        const now = Math.floor(Date.now() / 1000);
        const hoursRemaining = Math.ceil((cooldownEnd - now) / 3600);

        throw new Error(
          `You already checked in today. Please wait ${Math.max(0, hoursRemaining)} hours.`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("already checked in")) {
        throw error;
      }
      throw new Error("Failed to check cooldown status");
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
