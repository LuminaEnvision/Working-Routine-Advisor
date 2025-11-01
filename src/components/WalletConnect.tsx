import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export const WalletConnect = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    const connector = connectors[0]; // Use first available connector
    if (connector) {
      connect({ connector }, {
        onSuccess: () => {
          toast.success('Wallet connected successfully!');
        },
        onError: (error) => {
          toast.error(`Failed to connect: ${error.message}`);
        }
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
  };

  if (isConnected && address) {
    return (
      <Button
        onClick={handleDisconnect}
        variant="outline"
        className="w-full justify-start gap-2"
      >
        <Wallet className="w-4 h-4" />
        <span className="font-mono text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <LogOut className="w-4 h-4 ml-auto" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      className="w-full bg-gradient-primary gap-2"
      size="lg"
    >
      <Wallet className="w-5 h-5" />
      Connect Wallet
    </Button>
  );
};
