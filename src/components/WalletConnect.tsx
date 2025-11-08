import { useMemo, useState, useEffect } from "react";
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
        connect(
          { connector },
          {
            onSuccess: async () => {
              // Silent success - wallet is automatically connected in Farcaster
              setPendingId(null);
              // Ensure correct chain after connection
              await ensureCorrectChain();
            },
            onError: (connectionError) => {
              // Silent error - don't show toast for auto-connect failures
              console.warn('Farcaster wallet auto-connect failed:', connectionError);
              setPendingId(null);
            },
          }
        );
      }
    }
  }, [isInFarcaster, isConnected, hasAutoConnected, connectors, connect, error, reset, ensureCorrectChain]);

  // Filter connectors - show appropriate connectors based on context
  const availableConnectors = useMemo(() => {
    // In Farcaster: never show connect buttons - wallet auto-connects
    if (isInFarcaster) {
      return []; // No connect buttons in Farcaster - wallet is automatically available
    }
    
    // Standalone mode: show all connectors except Farcaster
    return connectors.filter(
      (connector) => 
        connector.ready && 
        connector.name !== 'Farcaster Wallet' &&
        !connector.id.includes('farcaster')
    );
  }, [connectors, isInFarcaster]);

  const handleConnect = async (connectorId: string) => {
    const connector = connectors.find((item) => item.id === connectorId);
    if (!connector) return;

    // Reset any previous connection errors
    if (error) {
      reset();
    }

    setPendingId(connector.id);
    try {
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
            const errorMessage = connectionError?.message ?? "Failed to connect wallet";
            // Don't show error for user cancellation
            if (!errorMessage.includes("reset") && !errorMessage.includes("rejected")) {
              toast.error(errorMessage);
            }
            setPendingId(null);
          },
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      if (!errorMessage.includes("reset") && !errorMessage.includes("rejected")) {
        toast.error(errorMessage);
      }
      setPendingId(null);
    }
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
