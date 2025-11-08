import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, Check } from "lucide-react";
import { isFarcasterMiniApp } from "@/lib/farcaster-miniapp";
import { toast } from "sonner";

interface ChooseWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletSelected?: () => void;
}

export const ChooseWalletDialog = ({
  open,
  onOpenChange,
  onWalletSelected,
}: ChooseWalletDialogProps) => {
  const { isConnected, connector } = useAccount();
  const { connect, connectors } = useConnect();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const isInFarcaster = isFarcasterMiniApp();

  // Debug: Log available connectors
  useEffect(() => {
    if (open) {
      console.log('Available connectors:', connectors.map(c => ({
        id: c.id,
        name: c.name,
        ready: c.ready,
        type: c.type
      })));
    }
  }, [open, connectors]);

  // Find Farcaster, MetaMask, and External wallet connectors
  // More flexible matching - check name, id, and type
  const farcasterConnector = connectors.find(
    (c) => c.ready && (
      c.name?.toLowerCase().includes("farcaster") ||
      c.id.toLowerCase().includes("farcaster") ||
      c.name === "Farcaster Wallet"
    )
  );
  // Find MetaMask - check multiple ways
  const metaMaskConnector = connectors.find(
    (c) => {
      if (!c.ready) return false;
      const name = c.name?.toLowerCase() || '';
      const id = c.id.toLowerCase();
      // Check if it's MetaMask connector or injected connector with MetaMask
      return (
        name.includes("metamask") ||
        id.includes("metamask") ||
        (c.type === "injected" && typeof window !== 'undefined' && window.ethereum?.isMetaMask && name !== "farcaster wallet")
      );
    }
  );
  const walletConnectConnector = connectors.find(
    (c) => c.ready && (
      c.name?.toLowerCase().includes("walletconnect") ||
      c.id.toLowerCase().includes("walletconnect") ||
      c.type === "walletConnect"
    )
  );
  
  // Other external connectors (excluding Safe and already listed ones)
  const otherConnectors = connectors.filter(
    (c) =>
      c.ready &&
      c !== farcasterConnector &&
      c !== metaMaskConnector &&
      c !== walletConnectConnector &&
      !c.name?.toLowerCase().includes("safe") &&
      !c.id.toLowerCase().includes("safe")
  );

  const handleSelectWallet = async (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return;

    setSelectedWallet(connectorId);
    setIsConnecting(true);

    try {
      connect(
        { connector },
        {
          onSuccess: () => {
            toast.success(`${connector.name} connected`);
            setIsConnecting(false);
            onWalletSelected?.();
            onOpenChange(false);
          },
          onError: (error) => {
            const errorMessage = error?.message ?? "Failed to connect wallet";
            if (!errorMessage.includes("reset") && !errorMessage.includes("rejected")) {
              toast.error(errorMessage);
            }
            setIsConnecting(false);
            setSelectedWallet(null);
          },
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection failed";
      if (!errorMessage.includes("reset") && !errorMessage.includes("rejected")) {
        toast.error(errorMessage);
      }
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleDone = () => {
    if (isConnected) {
      onOpenChange(false);
      onWalletSelected?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Choose preferred wallet</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            This wallet will be used for transactions in miniapps. You can change it anytime in
            Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Debug: Show all connectors if none found */}
          {!farcasterConnector && !metaMaskConnector && !walletConnectConnector && otherConnectors.length === 0 && (
            <div className="p-4 border border-dashed border-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">No connectors available. Available connectors:</p>
              <div className="space-y-1 text-xs">
                {connectors.map((c) => (
                  <div key={c.id} className="text-muted-foreground">
                    {c.name || 'Unknown'} ({c.id}) - Ready: {c.ready ? 'Yes' : 'No'} - Type: {c.type}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Farcaster Wallet Option */}
          {farcasterConnector && (
            <button
              onClick={() => {
                if (isConnected && connector?.id === farcasterConnector.id) {
                  // Already connected, just close
                  handleDone();
                } else {
                  handleSelectWallet(farcasterConnector.id);
                }
              }}
              disabled={isConnecting && selectedWallet !== farcasterConnector.id}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isConnected && connector?.id === farcasterConnector.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${isConnecting && selectedWallet === farcasterConnector.id ? "opacity-50 cursor-wait" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-celo flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">Farcaster Wallet</p>
                    {isInFarcaster && !isConnected && (
                      <p className="text-xs text-muted-foreground">Recommended</p>
                    )}
                  </div>
                </div>
                {isConnected && connector?.id === farcasterConnector.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">Connected</span>
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* MetaMask Option */}
          {metaMaskConnector && (
            <button
              onClick={() => {
                if (isConnected && connector?.id === metaMaskConnector.id) {
                  handleDone();
                } else {
                  handleSelectWallet(metaMaskConnector.id);
                }
              }}
              disabled={isConnecting && selectedWallet !== metaMaskConnector.id}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isConnected && connector?.id === metaMaskConnector.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${isConnecting && selectedWallet === metaMaskConnector.id ? "opacity-50 cursor-wait" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">MetaMask</p>
                    <p className="text-xs text-muted-foreground">Browser extension wallet</p>
                  </div>
                </div>
                {isConnected && connector?.id === metaMaskConnector.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">Connected</span>
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* WalletConnect Option */}
          {walletConnectConnector && (
            <button
              onClick={() => {
                if (isConnected && connector?.id === walletConnectConnector.id) {
                  handleDone();
                } else {
                  handleSelectWallet(walletConnectConnector.id);
                }
              }}
              disabled={isConnecting && selectedWallet !== walletConnectConnector.id}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isConnected && connector?.id === walletConnectConnector.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${isConnecting && selectedWallet === walletConnectConnector.id ? "opacity-50 cursor-wait" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">WalletConnect</p>
                    <p className="text-xs text-muted-foreground">Mobile & desktop wallets</p>
                  </div>
                </div>
                {isConnected && connector?.id === walletConnectConnector.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">Connected</span>
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* Other External Wallets */}
          {otherConnectors.length > 0 && otherConnectors.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                if (isConnected && connector?.id === c.id) {
                  handleDone();
                } else {
                  handleSelectWallet(c.id);
                }
              }}
              disabled={isConnecting && selectedWallet !== c.id}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                isConnected && connector?.id === c.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${isConnecting && selectedWallet === c.id ? "opacity-50 cursor-wait" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{c.name}</p>
                    <p className="text-xs text-muted-foreground">External wallet</p>
                  </div>
                </div>
                {isConnected && connector?.id === c.id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">Connected</span>
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {isConnected && (
          <Button onClick={handleDone} className="w-full bg-gradient-celo hover:opacity-90">
            Done
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

