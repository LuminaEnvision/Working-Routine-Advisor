import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChainManager } from "@/hooks/useChainManager";
import { celo } from "wagmi/chains";
import { formatAddress } from "@/lib/utils";

export const WalletMenu = () => {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const [isOpen, setIsOpen] = useState(false);

  const getConnectorLabel = (connector: (typeof connectors)[number]) => {
    const name = connector.name?.toLowerCase() ?? "";
    if (name.includes("farcaster")) return "Farcaster Wallet";
    if (name.includes("metamask")) return "MetaMask";
    if (connector.id === "walletConnect" || name.includes("walletconnect")) {
      return "WalletConnect";
    }
    if (connector.id === "injected" || name === "injected") {
      return "Browser Wallet";
    }
    if (name.includes("coinbase")) return "Coinbase Wallet";
    return connector.name ?? "Wallet";
  };

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return;

    connect(
      { connector },
      {
        onSuccess: async () => {
          toast.success("Wallet connected!");
          await ensureCorrectChain();
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to connect wallet");
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected");
    setIsOpen(false);
  };

  const handleSwitchChain = async () => {
    const switched = await ensureCorrectChain();
    if (switched) {
      toast.success("Switched to Celo network");
    }
    setIsOpen(false);
  };

  if (!isConnected) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connect Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {connectors
            .filter((connector) => connector.ready)
            .map((connector) => (
              <DropdownMenuItem
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                className="cursor-pointer"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {getConnectorLabel(connector)}
              </DropdownMenuItem>
            ))}
          {connectors.filter((connector) => connector.ready).length === 0 && (
            <DropdownMenuItem disabled>
              No wallets available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline font-mono text-xs">
            {formatAddress(address || "")}
          </span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Address</span>
            <span className="font-mono text-xs">{formatAddress(address || "")}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Network</span>
            <div className="flex items-center gap-2">
              <Badge variant={isOnCorrectChain ? "default" : "destructive"} className="text-xs">
                {chainId ? `Chain ${chainId}` : "Unknown"}
              </Badge>
              {isOnCorrectChain && (
                <Badge variant="outline" className="text-xs">
                  {celo.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {!isOnCorrectChain && chainId && (
          <>
            <DropdownMenuItem
              onClick={handleSwitchChain}
              className="cursor-pointer"
            >
              <span className="text-xs">Switch to Celo</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={handleDisconnect}
          className="cursor-pointer text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

