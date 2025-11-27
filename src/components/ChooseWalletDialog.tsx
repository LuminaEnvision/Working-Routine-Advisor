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
  const { connect, connectors } = useConnect({
    onSuccess: (data) => {
      toast.success(`${data.connector?.name ?? 'Wallet'} connected`);
      setIsConnecting(false);
      onWalletSelected?.();
      onOpenChange(false);
    },
    onError: (error) => {
      const errorMessage = error?.message ?? "Failed to connect wallet";
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
      setIsConnecting(false);
      setSelectedWallet(null);
    },
  });
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const isInFarcaster = isFarcasterMiniApp();

  // Debug: Log available connectors
  useEffect(() => {
    if (open) {
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      console.log('Browser:', isSafari ? 'Safari' : 'Other');
      console.log('Available connectors:', connectors.map(c => ({
        id: c.id,
        name: c.name,
        ready: c.ready,
        canConnect: isSafari || c.ready
      })));
      console.log('window.ethereum available:', typeof window !== 'undefined' && !!window.ethereum);
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log('window.ethereum.isMetaMask:', (window.ethereum as any).isMetaMask);
      }
    }
  }, [open, connectors]);

  // Detect Safari and mobile devices for more lenient connector filtering
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isMobileOrSafari = isMobile || isSafari;

  // Find Farcaster, MetaMask, and External wallet connectors
  // More flexible matching - check name, id, and type
  // On mobile/Safari, be more lenient with ready check - show connectors even if not immediately ready
  const farcasterConnector = connectors.find(
    (c) => (isMobileOrSafari || c.ready) && (
      c.name?.toLowerCase().includes("farcaster") ||
      c.id.toLowerCase().includes("farcaster") ||
      c.name === "Farcaster Wallet"
    )
  );
  // Find MetaMask - check multiple ways
  // Prioritize MetaMaskConnector over InjectedConnector to avoid duplicates
  // On mobile, always show MetaMask connector (mobile browsers can have MetaMask installed)
  const metaMaskConnector = connectors.find(
    (c) => {
      // On mobile/Safari, show MetaMask connector even if not ready
      if (!isMobileOrSafari && !c.ready) return false;
      const name = c.name?.toLowerCase() || '';
      const id = c.id.toLowerCase();
      // Prefer connectors with "metamask" in id/name over generic injected connectors
      // This ensures we pick MetaMaskConnector over InjectedConnector when both exist
      const isMetaMaskSpecific = name.includes("metamask") || id.includes("metamask");
      const isInjectedWithMetaMask = c.id === "injected" && typeof window !== 'undefined' && window.ethereum?.isMetaMask && name !== "farcaster wallet";

      // If we find a MetaMask-specific connector, use it
      if (isMetaMaskSpecific) return true;
      // Otherwise, only use injected connector if no MetaMask-specific connector exists
      return isInjectedWithMetaMask;
    }
  );
  // WalletConnect is especially important on mobile - always show it if available
  const walletConnectConnector = connectors.find(
    (c) => {
      // On mobile, always show WalletConnect (it's the best option for mobile)
      if (isMobile) return (
        c.name?.toLowerCase().includes("walletconnect") ||
        c.id.toLowerCase().includes("walletconnect")
      );
      // On Safari/desktop, show if ready or Safari
      return (isSafari || c.ready) && (
        c.name?.toLowerCase().includes("walletconnect") ||
        c.id.toLowerCase().includes("walletconnect")
      );
    }
  );

  // Hide "Injected Wallet" if MetaMask is available (MetaMask IS an injected wallet)
  // Only show it as a fallback if MetaMask isn't available
  // Also hide Safe and other connectors we don't want to show
  const otherConnectors = connectors.filter(
    (c) => {
      // Skip if already shown as a main option
      if (c === farcasterConnector || c === metaMaskConnector || c === walletConnectConnector) {
        return false;
      }

      // Skip Safe connector
      if (c.name?.toLowerCase().includes("safe") || c.id.toLowerCase().includes("safe")) {
        return false;
      }

      // Hide "Injected Wallet" if MetaMask is available
      // MetaMask is an injected wallet, so we don't need both
      // Also hide any injected connector that would show as MetaMask
      if (metaMaskConnector) {
        const isInjected = c.id === 'injected' || c.name === 'Injected' || c.name === 'Injected Wallet';
        const wouldShowAsMetaMask = isInjected && typeof window !== 'undefined' && window.ethereum?.isMetaMask;
        if (isInjected || wouldShowAsMetaMask) {
          return false;
        }
      }

      // Only show if ready (or Safari with lenient check)
      return isSafari || c.ready;
    }
  );

  const handleSelectWallet = async (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
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
      } else {
        toast.error(`${connector.name} is not available. Please install the wallet extension or try another option.`);
      }
      return;
    }

    setSelectedWallet(connectorId);
    setIsConnecting(true);

    try {
      connect({ connector });
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
              <p className="text-xs text-muted-foreground mb-2">
                {isSafari
                  ? "Safari detected: MetaMask may not work due to browser restrictions. Try WalletConnect or install MetaMask and grant permissions."
                  : "No connectors available. Available connectors:"}
              </p>
              {!isSafari && (
                <div className="space-y-1 text-xs">
                  {connectors.map((c) => (
                    <div key={c.id} className="text-muted-foreground">
                      {c.name || 'Unknown'} ({c.id}) - Ready: {c.ready ? 'Yes' : 'No'}
                    </div>
                  ))}
                </div>
              )}
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
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isConnected && connector?.id === farcasterConnector.id
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
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isConnected && connector?.id === metaMaskConnector.id
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
                    <p className="text-xs text-muted-foreground">
                      {isSafari && !metaMaskConnector.ready
                        ? "May not work in Safari - try WalletConnect"
                        : "Browser extension wallet"}
                    </p>
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
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isConnected && connector?.id === walletConnectConnector.id
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
                    <p className="text-xs text-muted-foreground">Connect via QR code (works with many wallets)</p>
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

          {/* Other External Wallets (fallback only - should be rare) */}
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
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isConnected && connector?.id === c.id
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

