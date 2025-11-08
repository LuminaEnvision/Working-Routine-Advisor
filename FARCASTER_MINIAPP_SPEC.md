# Farcaster Mini App Integration Spec
## Working Routine Advisor - Technical Specification

---

## 📋 Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Issues Identified](#issues-identified)
3. [Farcaster Mini App SDK Setup](#farcaster-mini-app-sdk-setup)
4. [Wagmi Configuration for Farcaster](#wagmi-configuration-for-farcaster)
5. [Wallet Connection & Chain Management](#wallet-connection--chain-management)
6. [Payment Gating Flow](#payment-gating-flow)
7. [Subscription Management](#subscription-management)
8. [UI/UX Implementation](#uiux-implementation)
9. [Smart Contract Integration](#smart-contract-integration)
10. [Security & UX Considerations](#security--ux-considerations)
11. [Code Snippets](#code-snippets)
12. [Questions & Missing Data](#questions--missing-data)

---

## 🔍 Current State Analysis

### What's Working ✅
- Smart contracts (`InsightsPayment.sol`, `InsightToken.sol`) are well-structured
- Basic wagmi setup with MetaMask, WalletConnect, Safe connectors
- Check-in flow with questions
- Subscription UI exists
- Payment hook (`use-InsightsPayment.ts`) handles contract interactions
- Farcaster auth-kit integration (for SIWE, not Mini App wallet)

### What's Missing ❌
- **Farcaster Mini App SDK** integration (currently using auth-kit which is different)
- **Farcaster wallet connector** in wagmi config
- **Detection of Farcaster Mini App context** (standalone vs embedded)
- **Payment gating before showing insights** (currently happens during check-in)
- **Chain switching logic** (ensure user is on Celo)
- **Proper flow**: Check-in → Payment Gate → Insights (currently mixed)

---

## ⚠️ Issues Identified

### Critical Issues

1. **Missing Farcaster Mini App SDK**
   - Currently using `@farcaster/auth-kit` which is for Sign-In with Ethereum (SIWE)
   - Need `@farcaster/frames` or `@farcaster/miniapp-sdk` for Mini App wallet integration
   - The auth-kit doesn't provide wallet connection inside Farcaster client

2. **No Farcaster Wallet Connector**
   - `wagmi-config.ts` has MetaMask, WalletConnect, Safe - but no Farcaster connector
   - Farcaster Mini Apps have an embedded wallet that needs a custom connector

3. **Payment Gating Logic**
   - Payment happens during check-in submission
   - Should gate **before** showing insights page
   - Flow should be: Complete Check-in → Check Payment Status → Pay if needed → Show Insights

4. **FarcasterProvider Configuration**
   - Uses Optimism RPC (`https://mainnet.optimism.io`) - should use Celo
   - Not detecting Mini App context

5. **Chain Switching**
   - No logic to detect if user is on wrong chain
   - No automatic switching to Celo

### Contract Issues (Review Needed)

1. **InsightsPayment.sol** - Line 32: `Ownable(msg.sender)` 
   - This is correct for Solidity 0.8.20+, but verify it compiles
   - ✅ Looks good

2. **Check-in Cooldown**
   - Contract has 1-day cooldown (`CHECKIN_COOLDOWN = 1 days`)
   - Frontend doesn't check this before allowing check-in
   - Should add UI feedback for cooldown status

3. **IPFS Hash**
   - Contract expects IPFS hash in `submitCheckin`
   - Currently using `keccak256(stringToBytes(payload))` which is NOT an IPFS hash
   - This is a placeholder - need to decide: use actual IPFS or keep hash

---

## 🚀 Farcaster Mini App SDK Setup

### Step 1: Install Required Packages

```bash
npm install @farcaster/frames @farcaster/miniapp-sdk
# OR if using frames SDK:
npm install @farcaster/frames wagmi viem
```

**Note**: Farcaster Mini App SDK is still evolving. Check the latest docs:
- https://docs.farcaster.xyz/miniapps
- The SDK may be part of `@farcaster/frames` or a separate package

### Step 2: Detect Farcaster Mini App Context

Create a utility to detect if the app is running inside Farcaster:

```typescript
// src/lib/farcaster-miniapp.ts
export const isFarcasterMiniApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Method 1: Check for Farcaster SDK
  if (window.farcaster?.sdk) return true;
  
  // Method 2: Check user agent or referrer
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('farcaster') || ua.includes('warpcast')) return true;
  
  // Method 3: Check for Farcaster-specific query params
  const params = new URLSearchParams(window.location.search);
  if (params.get('farcaster') === 'true') return true;
  
  // Method 4: Check parent window (if embedded in iframe)
  try {
    if (window.parent !== window && window.parent.location.hostname.includes('warpcast.com')) {
      return true;
    }
  } catch (e) {
    // Cross-origin, might be Farcaster
  }
  
  return false;
};

export const getFarcasterSDK = () => {
  if (typeof window !== 'undefined' && window.farcaster?.sdk) {
    return window.farcaster.sdk;
  }
  return null;
};
```

### Step 3: Initialize Farcaster Mini App SDK

```typescript
// src/lib/farcaster-miniapp.ts (continued)
import { sdk } from '@farcaster/miniapp-sdk'; // Adjust import based on actual SDK

export const initializeFarcasterSDK = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Initialize SDK
    await sdk.actions.ready();
    
    // Get context
    const context = await sdk.context;
    
    return {
      sdk,
      context,
      isReady: true,
    };
  } catch (error) {
    console.warn('Farcaster SDK not available:', error);
    return null;
  }
};
```

---

## 🔌 Wagmi Configuration for Farcaster

### Step 1: Create Farcaster Wallet Connector

**Important**: Farcaster Mini Apps use an embedded wallet. You need a custom connector or use the wallet provider from the SDK.

```typescript
// src/lib/farcaster-connector.ts
import { createConnector } from 'wagmi';
import { getFarcasterSDK, isFarcasterMiniApp } from './farcaster-miniapp';

/**
 * Farcaster Mini App Wallet Connector
 * This connector uses Farcaster's embedded wallet when running inside Farcaster
 */
export const createFarcasterConnector = () => {
  if (!isFarcasterMiniApp()) {
    return null; // Not in Farcaster context
  }

  return createConnector((config) => ({
    id: 'farcaster',
    name: 'Farcaster Wallet',
    type: 'injected',
    
    async connect(parameters) {
      const sdk = getFarcasterSDK();
      if (!sdk) {
        throw new Error('Farcaster SDK not available');
      }

      // Get wallet from Farcaster SDK
      const wallet = await sdk.wallet;
      
      if (!wallet) {
        throw new Error('Farcaster wallet not available');
      }

      // Get accounts
      const accounts = await wallet.request({
        method: 'eth_accounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = await wallet.request({
        method: 'eth_chainId',
      });

      return {
        accounts: accounts as `0x${string}`[],
        chainId: Number(chainId),
      };
    },

    async disconnect() {
      // Farcaster wallet doesn't disconnect, just clear local state
      config.emitter.emit('disconnect');
    },

    async getAccounts() {
      const sdk = getFarcasterSDK();
      if (!sdk) return [];
      
      const wallet = await sdk.wallet;
      if (!wallet) return [];
      
      const accounts = await wallet.request({
        method: 'eth_accounts',
      });
      
      return (accounts || []) as `0x${string}`[];
    },

    async getChainId() {
      const sdk = getFarcasterSDK();
      if (!sdk) return config.chains[0].id;
      
      const wallet = await sdk.wallet;
      if (!wallet) return config.chains[0].id;
      
      const chainId = await wallet.request({
        method: 'eth_chainId',
      });
      
      return Number(chainId);
    },

    async isAuthorized() {
      const accounts = await this.getAccounts();
      return accounts.length > 0;
    },

    async switchChain({ chainId }) {
      const sdk = getFarcasterSDK();
      if (!sdk) {
        throw new Error('Farcaster SDK not available');
      }

      const wallet = await sdk.wallet;
      if (!wallet) {
        throw new Error('Farcaster wallet not available');
      }

      // Request chain switch
      await wallet.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      return config.chains.find((c) => c.id === chainId) || config.chains[0];
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', { accounts: accounts as `0x${string}`[] });
      }
    },

    onChainChanged(chainId) {
      config.emitter.emit('change', { chainId: Number(chainId) });
    },
  }));
};
```

**Alternative Approach**: If Farcaster SDK provides a wallet provider directly, you might be able to use it with wagmi's `injected` connector:

```typescript
// Simpler approach if SDK exposes window.ethereum
export const farcasterConnector = new InjectedConnector({
  chains: [celo],
  options: {
    name: 'Farcaster',
    shimDisconnect: true,
    getProvider: () => {
      const sdk = getFarcasterSDK();
      return sdk?.wallet || window.ethereum;
    },
  },
});
```

### Step 2: Update wagmi-config.ts

```typescript
// src/lib/wagmi-config.ts
import { createConfig } from "wagmi";
import { http } from "viem";
import { celo, celoAlfajores } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { InjectedConnector } from "wagmi/connectors/injected";
import { createFarcasterConnector } from "./farcaster-connector";
import { isFarcasterMiniApp } from "./farcaster-miniapp";

const rpcUrl = import.meta.env.VITE_CELO_RPC_URL ?? "https://forno.celo.org";
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

// Use testnet in development, mainnet in production
const isDevelopment = import.meta.env.DEV;
const targetChain = isDevelopment ? celoAlfajores : celo;

const appMetadata = {
  name: "Working Routine Advisor",
  icon: "https://farcaster-working-routine-advisor.app/icon.png",
};

const connectors = [];

// 1. Farcaster connector (highest priority if in Farcaster context)
if (isFarcasterMiniApp()) {
  const farcasterConn = createFarcasterConnector();
  if (farcasterConn) {
    connectors.push(farcasterConn);
  }
}

// 2. Injected connector (for Farcaster wallet if SDK exposes it)
connectors.push(
  new InjectedConnector({
    chains: [targetChain],
    options: {
      name: 'Farcaster Wallet',
      shimDisconnect: true,
      getProvider: () => {
        // Check for Farcaster wallet first
        if (typeof window !== 'undefined' && window.farcaster?.wallet) {
          return window.farcaster.wallet;
        }
        // Fallback to MetaMask or other injected
        return window.ethereum;
      },
    },
  })
);

// 3. MetaMask (for standalone web app)
connectors.push(
  new MetaMaskConnector({
    chains: [targetChain],
    options: {
      shimDisconnect: true,
    },
  })
);

// 4. WalletConnect (for mobile wallets)
if (walletConnectProjectId) {
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
}

// 5. Safe connector
connectors.push(
  new SafeConnector({
    chains: [targetChain],
    options: {
      allowedDomains: [/app.safe.global$/],
      debug: false,
    },
  })
);

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors,
  transports: {
    [targetChain.id]: http(rpcUrl),
  },
});
```

---

## 💼 Wallet Connection & Chain Management

### Step 1: Create Chain Detection & Switching Hook

```typescript
// src/hooks/useChainManager.ts
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { celo, celoAlfajores } from 'wagmi/chains';
import { toast } from 'sonner';
import { useCallback } from 'react';

const TARGET_CHAIN_ID = import.meta.env.DEV 
  ? celoAlfajores.id 
  : celo.id;

export const useChainManager = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isOnCorrectChain = chainId === TARGET_CHAIN_ID;
  const targetChain = import.meta.env.DEV ? celoAlfajores : celo;

  const ensureCorrectChain = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return false;
    }

    if (isOnCorrectChain) {
      return true;
    }

    try {
      toast.info(`Switching to ${targetChain.name}...`);
      await switchChain({ chainId: TARGET_CHAIN_ID });
      toast.success(`Switched to ${targetChain.name}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to switch chain';
      toast.error(`Chain switch failed: ${message}`);
      return false;
    }
  }, [isConnected, isOnCorrectChain, switchChain, targetChain]);

  return {
    chainId,
    isOnCorrectChain,
    isSwitching,
    targetChain,
    ensureCorrectChain,
  };
};
```

### Step 2: Update WalletConnect Component

```typescript
// src/components/WalletConnect.tsx (updated)
import { useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isFarcasterMiniApp } from "@/lib/farcaster-miniapp";
import { useChainManager } from "@/hooks/useChainManager";

export const WalletConnect = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, status, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const isInFarcaster = isFarcasterMiniApp();

  // Filter connectors - hide "Connect" button if in Farcaster and already connected
  const availableConnectors = useMemo(() => {
    if (isInFarcaster && isConnected) {
      return []; // Don't show connectors in Farcaster if already connected
    }
    return connectors.filter((connector) => connector.ready);
  }, [connectors, isInFarcaster, isConnected]);

  const handleConnect = async (connectorId: string) => {
    const connector = connectors.find((item) => item.id === connectorId);
    if (!connector) return;

    setPendingId(connector.id);
    connect(
      { connector },
      {
        onSuccess: async () => {
          toast.success(`${connector.name} connected`);
          setPendingId(null);
          // Ensure correct chain after connection
          await ensureCorrectChain();
        },
        onError: (connectionError) => {
          toast.error(connectionError?.message ?? "Failed to connect wallet");
          setPendingId(null);
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect();
    reset();
    toast.info("Wallet disconnected");
  };

  // In Farcaster, if connected, show minimal UI
  if (isInFarcaster && isConnected && address) {
    return (
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          disabled
        >
          <Wallet className="w-4 h-4" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {!isOnCorrectChain && (
            <Badge variant="destructive" className="ml-auto">
              Wrong Chain
            </Badge>
          )}
        </Button>
        {!isOnCorrectChain && (
          <Button
            onClick={ensureCorrectChain}
            className="w-full"
            variant="default"
          >
            Switch to Celo
          </Button>
        )}
      </div>
    );
  }

  // Standalone web app or not connected
  if (isConnected && address) {
    return (
      <div className="space-y-2">
        <Button
          onClick={handleDisconnect}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          {!isOnCorrectChain && (
            <Badge variant="destructive" className="ml-auto">
              Wrong Chain
            </Badge>
          )}
          <LogOut className="w-4 h-4 ml-auto" />
        </Button>
        {!isOnCorrectChain && (
          <Button
            onClick={ensureCorrectChain}
            className="w-full"
            variant="default"
          >
            Switch to Celo
          </Button>
        )}
      </div>
    );
  }

  // Show connectors only if not in Farcaster or not connected
  if (availableConnectors.length === 0 && !isConnected) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
        {isInFarcaster
          ? "Wallet will connect automatically in Farcaster"
          : "No wallet connectors available"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {availableConnectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => handleConnect(connector.id)}
          className="w-full bg-gradient-primary gap-2"
          disabled={status === "pending" && pendingId === connector.id}
        >
          <Wallet className="w-5 h-5" />
          {status === "pending" && pendingId === connector.id
            ? `Connecting ${connector.name}...`
            : `Connect ${connector.name}`}
        </Button>
      ))}
      {error && (
        <p className="text-sm text-destructive">
          {error.message || "Connection failed"}
        </p>
      )}
    </div>
  );
};
```

---

## 💳 Payment Gating Flow

### Current Flow (Wrong)
1. User completes check-in questions
2. User clicks "Submit Check-In"
3. Payment happens during submission
4. User navigates to home (no insights shown)

### Correct Flow (Should Be)
1. User completes check-in questions
2. User clicks "Submit Check-In" (saves answers locally)
3. **Payment Gate**: Check subscription status
   - If subscribed/lifetime → Go to insights
   - If not subscribed → Show payment screen
4. User pays 0.1 CELO (one-off) or subscribes
5. After payment confirmation → Show insights

### Step 1: Create Payment Gate Component

```typescript
// src/components/PaymentGate.tsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, CreditCard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useInsightsPayment } from '@/hooks/use-InsightsPayment';
import { useChainManager } from '@/hooks/useChainManager';
import { parseUnits, formatUnits } from 'viem';
import { useBalance } from 'wagmi';

const CHECKIN_FEE = parseUnits('0.1', 18);

interface PaymentGateProps {
  checkInData: {
    answers: Record<string, string>;
    timestamp: string;
  };
  onPaymentComplete: () => void;
}

export const PaymentGate = ({ checkInData, onPaymentComplete }: PaymentGateProps) => {
  const { address, isConnected } = useAccount();
  const { isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const { status, isLoading, submitCheckin, isProcessing } = useInsightsPayment();
  const navigate = useNavigate();
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  const { data: balance } = useBalance({
    address,
    enabled: isConnected && !!address,
  });

  const requiresFee = !status.hasLifetime && !status.isSubscribed;
  const hasSufficientBalance = balance
    ? balance.value >= CHECKIN_FEE
    : false;

  useEffect(() => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      navigate('/daily-checkin');
      return;
    }

    if (!isOnCorrectChain) {
      ensureCorrectChain();
    }
  }, [isConnected, isOnCorrectChain, ensureCorrectChain, navigate]);

  // If subscribed or lifetime, skip payment
  useEffect(() => {
    if (!isLoading && !requiresFee) {
      // User has access, proceed to insights
      handleProceedToInsights();
    }
  }, [isLoading, requiresFee]);

  const handleProceedToInsights = async () => {
    try {
      // Submit check-in without fee (already subscribed)
      const payload = JSON.stringify(checkInData);
      const hash = keccak256(stringToBytes(payload));
      
      await submitCheckin(hash, false);
      
      // Save to localStorage
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
      checkIns.push(checkInData);
      localStorage.setItem('checkIns', JSON.stringify(checkIns));

      onPaymentComplete();
      navigate('/recommendations');
    } catch (error) {
      toast.error('Failed to submit check-in');
    }
  };

  const handleOneOffPayment = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isOnCorrectChain) {
      const switched = await ensureCorrectChain();
      if (!switched) return;
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. Need ${formatUnits(CHECKIN_FEE, 18)} CELO`);
      return;
    }

    try {
      setIsCheckingBalance(true);
      
      // Submit check-in with fee
      const payload = JSON.stringify(checkInData);
      const hash = keccak256(stringToBytes(payload));
      
      const txHash = await submitCheckin(hash, true);
      
      toast.success('Payment successful!', {
        description: `Transaction: ${txHash}`,
      });

      // Save to localStorage
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
      checkIns.push(checkInData);
      localStorage.setItem('checkIns', JSON.stringify(checkIns));

      onPaymentComplete();
      navigate('/recommendations');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast.error(message);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const handleSubscribe = () => {
    navigate('/subscribe');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Checking subscription status...</div>
        </CardContent>
      </Card>
    );
  }

  if (!requiresFee) {
    // User has access, processing...
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Processing your check-in...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <CardTitle>Unlock Your Insights</CardTitle>
          </div>
          <CardDescription>
            Choose how you'd like to access your personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* One-off Payment Option */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">One-time Access</CardTitle>
                <Badge variant="secondary">0.1 CELO</Badge>
              </div>
              <CardDescription>
                Pay once to view insights for this check-in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-mono">
                  {balance ? formatUnits(balance.value, 18) : '0'} CELO
                </span>
              </div>
              {!hasSufficientBalance && (
                <p className="text-xs text-destructive">
                  Insufficient balance. You need {formatUnits(CHECKIN_FEE, 18)} CELO
                </p>
              )}
              <Button
                onClick={handleOneOffPayment}
                disabled={!hasSufficientBalance || isProcessing || isCheckingBalance}
                className="w-full bg-gradient-primary"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isProcessing || isCheckingBalance
                  ? 'Processing...'
                  : `Pay ${formatUnits(CHECKIN_FEE, 18)} CELO`}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Option */}
          <Card className="border-2 border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Monthly Subscription</CardTitle>
                <Badge variant="secondary">6.9 cUSD/month</Badge>
              </div>
              <CardDescription>
                Unlimited check-ins, AI chat, and stats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSubscribe}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Step 2: Update DailyCheckIn to Use Payment Gate

```typescript
// src/pages/DailyCheckIn.tsx (updated flow)
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { PaymentGate } from '@/components/PaymentGate';
// ... other imports

const DailyCheckIn = () => {
  const { isConnected } = useAccount();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showPaymentGate, setShowPaymentGate] = useState(false);

  // ... existing question logic

  const handleCheckIn = async () => {
    if (!answers[question.id]) {
      toast.error('Please select an answer');
      return;
    }

    if (!isConnected) {
      toast.error('Connect your wallet to submit the check-in');
      return;
    }

    if (isLastQuestion) {
      // Show payment gate instead of submitting immediately
      setShowPaymentGate(true);
    } else {
      setCurrentQuestion((q) => q + 1);
    }
  };

  if (showPaymentGate) {
    return (
      <PaymentGate
        checkInData={{
          answers,
          timestamp: new Date().toISOString(),
        }}
        onPaymentComplete={() => setShowPaymentGate(false)}
      />
    );
  }

  // ... rest of check-in UI
};
```

---

## 📅 Subscription Management

### Step 1: Enhanced Subscription Status Hook

```typescript
// src/hooks/use-InsightsPayment.ts (additions)
// Add subscription expiry checking and renewal logic

export const useInsightsPayment = () => {
  // ... existing code

  const isSubscriptionExpiringSoon = useMemo(() => {
    if (!status.isSubscribed || status.subscriptionExpiry === 0) return false;
    const daysUntilExpiry = (status.subscriptionExpiry * 1000 - Date.now()) / (1000 * 60 * 60 * 24);
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0; // Expiring in 7 days
  }, [status]);

  const daysUntilExpiry = useMemo(() => {
    if (!status.isSubscribed || status.subscriptionExpiry === 0) return 0;
    return Math.ceil((status.subscriptionExpiry * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
  }, [status]);

  return {
    // ... existing returns
    isSubscriptionExpiringSoon,
    daysUntilExpiry,
  };
};
```

### Step 2: Subscription Renewal Component

```typescript
// src/components/SubscriptionRenewal.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInsightsPayment } from '@/hooks/use-InsightsPayment';
import { toast } from 'sonner';

export const SubscriptionRenewal = () => {
  const { status, isSubscriptionExpiringSoon, daysUntilExpiry, subscribe, isProcessing } = useInsightsPayment();

  if (!status.isSubscribed && !status.hasLifetime) {
    return null; // Not subscribed
  }

  if (status.hasLifetime) {
    return (
      <Alert>
        <AlertDescription>
          ✅ You have lifetime access! No renewal needed.
        </AlertDescription>
      </Alert>
    );
  }

  const handleRenew = async () => {
    try {
      const txHash = await subscribe();
      toast.success('Subscription renewed!', {
        description: `Transaction: ${txHash}`,
      });
    } catch (error) {
      toast.error('Renewal failed');
    }
  };

  return (
    <Card className={isSubscriptionExpiringSoon ? 'border-warning' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription Status</span>
          <Badge variant={isSubscriptionExpiringSoon ? 'destructive' : 'secondary'}>
            {daysUntilExpiry} days left
          </Badge>
        </CardTitle>
        <CardDescription>
          {isSubscriptionExpiringSoon
            ? 'Your subscription is expiring soon. Renew to continue access.'
            : 'Your subscription is active.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleRenew}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processing...' : 'Renew Subscription (6.9 cUSD)'}
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 🎨 UI/UX Implementation

### Mobile-First Design Principles

1. **Touch-Friendly Targets**: Buttons should be at least 44x44px
2. **Swipe Gestures**: Consider swipe navigation for check-in questions
3. **Bottom Sheets**: Use bottom sheets for payment modals on mobile
4. **Loading States**: Clear loading indicators during transactions
5. **Error Recovery**: Easy retry buttons for failed transactions

### Component Structure

```
src/
  components/
    PaymentGate.tsx          # Payment gating screen
    SubscriptionRenewal.tsx  # Subscription management
    ChainSwitcher.tsx        # Chain switching UI
    CheckInProgress.tsx      # Progress indicator for check-in
    InsightsDisplay.tsx      # Insights/recommendations display
    AIChatInterface.tsx      # AI chat component (future)
```

### Example: Mobile-Optimized Payment Gate

```typescript
// Use Sheet component for mobile-friendly bottom sheet
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const PaymentGateMobile = ({ open, onOpenChange, ...props }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh]">
        <SheetHeader>
          <SheetTitle>Unlock Insights</SheetTitle>
          <SheetDescription>
            Choose your payment method
          </SheetDescription>
        </SheetHeader>
        <PaymentGate {...props} />
      </SheetContent>
    </Sheet>
  );
};
```

---

## 🔐 Smart Contract Integration

### Current Contract Review

**InsightsPayment.sol** - ✅ Generally good, but note:

1. **IPFS Hash**: Contract expects IPFS hash, but frontend uses `keccak256`. Decide:
   - Option A: Use actual IPFS (store check-in data on IPFS, use hash)
   - Option B: Keep using hash (simpler, but not decentralized storage)

2. **Cooldown Check**: Frontend should check `getCheckInStatus()` before allowing check-in

3. **Gas Optimization**: Consider batching operations if adding more features

### Integration Pattern

```typescript
// Example: Complete check-in flow with all validations
const handleCompleteCheckIn = async () => {
  // 1. Check wallet connection
  if (!isConnected) throw new Error('Wallet not connected');

  // 2. Check chain
  if (!isOnCorrectChain) {
    await ensureCorrectChain();
  }

  // 3. Check cooldown (read from contract)
  const canCheckIn = await publicClient.readContract({
    address: INSIGHTS_PAYMENT_ADDRESS,
    abi: InsightsPaymentArtifact.abi,
    functionName: 'getCheckInStatus',
    args: [address],
  });

  if (canCheckIn) {
    throw new Error('You already checked in today. Please wait 24 hours.');
  }

  // 4. Check subscription status
  const isSubscribed = await publicClient.readContract({
    address: INSIGHTS_PAYMENT_ADDRESS,
    abi: InsightsPaymentArtifact.abi,
    functionName: 'isSubscribed',
    args: [address],
  });

  // 5. Submit check-in
  const requiresFee = !isSubscribed && !status.hasLifetime;
  await submitCheckin(ipfsHash, requiresFee);
};
```

---

## 🛡️ Security & UX Considerations

### Security

1. **Front-end vs Back-end Validation**
   - ✅ Frontend: UX checks (balance, chain, subscription status)
   - ✅ Smart Contract: Final authority (payment, cooldown, subscription)
   - ⚠️ Never trust frontend alone for payments

2. **Gas Fees**
   - Inform users about gas costs
   - Consider gas estimation before transactions
   - Show gas cost in UI

3. **Payment Failures**
   - Clear error messages
   - Retry mechanisms
   - Fallback options (e.g., "Try subscribing instead")

4. **Chain Mismatch**
   - Auto-detect wrong chain
   - One-click chain switching
   - Clear warnings

### UX Considerations

1. **Loading States**
   - Transaction pending: "Waiting for confirmation..."
   - Transaction confirmed: "Payment successful!"
   - Show transaction hash for tracking

2. **Cancellation**
   - Allow users to cancel pending transactions
   - Clear "Back" buttons in payment flow

3. **Subscription Renewal**
   - Notify users 7 days before expiry
   - Auto-renew option (future)
   - Easy cancellation (if needed)

4. **Off-chain Metadata**
   - Store check-in answers in localStorage (temporary)
   - Consider IPFS for permanent storage
   - Backend API for insights generation (optional)

---

## 📝 Code Snippets Summary

### 1. Farcaster Detection & Initialization

```typescript
// src/lib/farcaster-miniapp.ts
export const isFarcasterMiniApp = (): boolean => {
  // Check multiple methods to detect Farcaster context
};

export const initializeFarcasterSDK = async () => {
  // Initialize SDK and call sdk.actions.ready()
};
```

### 2. Wagmi Config with Farcaster Connector

```typescript
// src/lib/wagmi-config.ts
// Add Farcaster connector to connectors array
// Prioritize Farcaster connector when in Farcaster context
```

### 3. Chain Management Hook

```typescript
// src/hooks/useChainManager.ts
export const useChainManager = () => {
  // Detect chain, switch if needed
};
```

### 4. Payment Gate Component

```typescript
// src/components/PaymentGate.tsx
// Gate component that checks subscription and handles payment
```

### 5. Updated Check-in Flow

```typescript
// src/pages/DailyCheckIn.tsx
// Complete questions → Show PaymentGate → Navigate to insights
```

---

## ❓ Questions & Missing Data

### Critical Questions for You:

1. **Farcaster Mini App SDK Package**
   - What is the exact package name? Is it `@farcaster/miniapp-sdk` or `@farcaster/frames`?
   - What is the latest version and API?
   - Can you provide the official documentation link?

2. **Farcaster Wallet Provider**
   - How does Farcaster expose the wallet? Is it `window.farcaster.wallet` or `sdk.wallet`?
   - Does it follow EIP-1193 (like MetaMask)?
   - Can you test in Farcaster and share the wallet object structure?

3. **Contract Addresses**
   - Are the contract addresses in `contractConfig.ts` for mainnet or testnet?
   - Do you have testnet addresses for development?

4. **IPFS Integration**
   - Do you want to use actual IPFS for check-in data storage?
   - Or keep using `keccak256` hash as placeholder?
   - If IPFS, which service? (Pinata, Web3.Storage, etc.)

5. **Developer Wallet Address**
   - What is your developer wallet address for receiving payments?
   - Should this be the contract owner address (for withdrawals)?

6. **Insights Generation**
   - How are insights generated? On-chain, off-chain API, or client-side?
   - Do you have an API endpoint for generating recommendations?

7. **Environment Variables**
   - `VITE_CELO_RPC_URL` - Do you have a custom RPC or use public?
   - `VITE_WALLETCONNECT_PROJECT_ID` - Is this set?
   - Any other required env vars?

8. **Testing**
   - Do you have access to Farcaster test environment?
   - Can you test the Mini App integration?

### Missing Implementation Details:

1. **Farcaster SDK Initialization**
   - Exact import path and initialization code
   - How to detect if SDK is available

2. **Wallet Connection in Farcaster**
   - Exact API for connecting wallet
   - How to handle auto-connection in Farcaster context

3. **Transaction Signing**
   - Does Farcaster wallet support all required methods?
   - Any special handling needed for Celo transactions?

---

## 🎯 Next Steps

1. **Get Farcaster SDK Information**
   - Research latest Farcaster Mini App SDK docs
   - Test wallet connection in Farcaster environment
   - Document exact API

2. **Implement Farcaster Connector**
   - Create connector based on actual SDK API
   - Test in Farcaster context

3. **Update Payment Flow**
   - Implement PaymentGate component
   - Update DailyCheckIn to use gate
   - Test end-to-end flow

4. **Add Chain Switching**
   - Implement useChainManager hook
   - Add UI for chain switching
   - Test chain detection

5. **Enhance UI/UX**
   - Mobile-optimize components
   - Add loading states
   - Improve error handling

6. **Testing**
   - Test in standalone web app
   - Test in Farcaster Mini App context
   - Test payment flows
   - Test subscription management

---

## 📚 Resources

- [Farcaster Docs](https://docs.farcaster.xyz/)
- [Wagmi Docs](https://wagmi.sh/)
- [Viem Docs](https://viem.sh/)
- [Celo Docs](https://docs.celo.org/)

---

**Note**: This spec is based on current codebase analysis. Some implementation details (especially Farcaster SDK) need to be confirmed with actual SDK documentation and testing.

