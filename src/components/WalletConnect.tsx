import { useMemo, useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isFarcasterMiniApp } from "@/lib/farcaster-miniapp";
import { useChainManager } from "@/hooks/useChainManager";

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, status, error, reset } = useConnect();
  const { disconnect } = useDisconnect();
  const { isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [hasAutoConnected, setHasAutoConnected] = useState(false);
  const isInFarcaster = isFarcasterMiniApp();

  // Auto-connect Farcaster wallet immediately when in Farcaster context
  // In Farcaster, the wallet is already available - no user interaction needed
  useEffect(() => {
    if (isInFarcaster && !isConnected && !hasAutoConnected && connectors.length > 0) {
      const farcasterConnector = connectors.find(
        (connector) =>
          connector.ready &&
          (connector.name === 'Farcaster Wallet' || connector.id.includes('farcaster'))
      );

      if (farcasterConnector) {
        setHasAutoConnected(true);
        // Connect immediately - wallet is already available in Farcaster
        const connector = connectors.find((item) => item.id === farcasterConnector.id);
        if (!connector) return;

        // Reset any previous connection errors
        if (error) {
          reset();
        }

        setPendingId(connector.id);
        setPendingId(connector.id);
        connectAsync({ connector })
          .then(async () => {
            // Silent success - wallet is automatically connected in Farcaster
            setPendingId(null);
            // Ensure correct chain after connection
            await ensureCorrectChain();
          })
          .catch((connectionError) => {
            // Silent error - don't show toast for auto-connect failures
            console.warn('Farcaster wallet auto-connect failed:', connectionError);
            setPendingId(null);
          });
      }
    }
  }, [isInFarcaster, isConnected, hasAutoConnected, connectors, connectAsync, error, reset, ensureCorrectChain]);

  // Filter connectors - show appropriate connectors based on context
  const availableConnectors = useMemo(() => {
    // In Farcaster: never show connect buttons - wallet auto-connects
    if (isInFarcaster) {
      return []; // No connect buttons in Farcaster - wallet is automatically available
    }

    // Detect Safari for more lenient connector filtering
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Find MetaMask connector first
    const metaMaskConnector = connectors.find(
      (c) => {
        if (!isSafari && !c.ready) return false;
        const name = c.name?.toLowerCase() || '';
        const id = c.id.toLowerCase();
        return (
          name.includes("metamask") ||
          id.includes("metamask") ||
          ((c as any).type === "injected" && typeof window !== 'undefined' && window.ethereum?.isMetaMask && name !== "farcaster wallet")
        );
      }
    );

    // Standalone mode: show connectors except Farcaster and Injected (if MetaMask is available)
    // In Safari, show connectors even if not immediately ready
    return connectors.filter(
      (connector) => {
        // Skip if not ready (unless Safari)
        if (!isSafari && !connector.ready) return false;

        // Skip Farcaster wallet
        if (connector.name === 'Farcaster Wallet' || connector.id.includes('farcaster')) {
          return false;
        }

        // Hide "Injected Wallet" if MetaMask is available (MetaMask IS an injected wallet)
        if (metaMaskConnector && (connector.name === 'Injected' || connector.name === 'Injected Wallet' || connector.id === 'injected')) {
          return false;
        }

        // Skip Safe connector
        if (connector.name?.toLowerCase().includes("safe") || connector.id.toLowerCase().includes("safe")) {
          return false;
        }

        return true;
      }
    );
  }, [connectors, isInFarcaster]);

  const handleConnect = async (connectorId: string) => {
    const connector = connectors.find((item) => item.id === connectorId);
    if (!connector) {
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        toast.error(
          "Wallet not found. In Safari, please install MetaMask extension or use WalletConnect to connect a mobile wallet.",
          { duration: 6000 }
        );
      } else {
        toast.error("Wallet connector not found. Please try another wallet option.");
      }
      return;
    }

    // Check if connector is ready (especially important for Safari)
    if (!connector.ready) {
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari && connector.name?.toLowerCase().includes('metamask')) {
        toast.error(
          "MetaMask not detected in Safari. Please install MetaMask extension or use WalletConnect instead.",
          { duration: 6000 }
        );
        return;
      }
      toast.error(`${connector.name} is not available. Please install the wallet extension or try another option.`);
      return;
    }

    // Reset any previous connection errors
    if (error) {
      reset();
    }

    setPendingId(connector.id);
    try {
      setPendingId(connector.id);
      try {
        await connectAsync({ connector });
        toast.success(`${connector.name} connected`);
        setPendingId(null);
        // Ensure correct chain after connection
        await ensureCorrectChain();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Connection failed";
        // Don't show error for user cancellation
        if (!errorMessage.includes("reset") && !errorMessage.includes("rejected") && !errorMessage.includes("User rejected")) {
          const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          if (isSafari && errorMessage.includes("Connector not found")) {
            toast.error(
              "No wallet found. In Safari, please install MetaMask or use WalletConnect to connect a mobile wallet.",
              { duration: 6000 }
            );
          } else {
            toast.error(errorMessage);
          }
        }
        setPendingId(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      if (!errorMessage.includes("reset") && !errorMessage.includes("rejected") && !errorMessage.includes("User rejected")) {
        const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari && (errorMessage.includes("Connector not found") || errorMessage.includes("not found"))) {
          toast.error(
            "No wallet found. In Safari, please install MetaMask or use WalletConnect to connect a mobile wallet.",
            { duration: 6000 }
          );
        } else {
          toast.error(errorMessage);
        }
      }
      setPendingId(null);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      reset();
      // Clear any local storage related to WalletConnect if needed
      localStorage.removeItem('walletconnect');
      toast.info("Wallet disconnected");
    } catch (e) {
      console.error('Disconnect error:', e);
      // Force reset anyway
      reset();
    }
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
            <div className="ml-auto">
              <Badge variant="destructive">
                Wrong Chain
              </Badge>
            </div>
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
            <div className="ml-auto">
              <Badge variant="destructive">
                Wrong Chain
              </Badge>
            </div>
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

  // In Farcaster: show loading state while auto-connecting
  if (isInFarcaster && !isConnected) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
        {hasAutoConnected
          ? "Connecting Farcaster wallet..."
          : "Initializing Farcaster wallet..."}
      </div>
    );
  }

  // Standalone mode: show message if no connectors available
  if (availableConnectors.length === 0 && !isConnected) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground text-center">
        No wallet connectors available
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
          disabled={status === "loading" && pendingId === connector.id}
        >
          <Wallet className="w-5 h-5" />
          {status === "loading" && pendingId === connector.id
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
