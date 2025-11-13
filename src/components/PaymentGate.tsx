import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Lock, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useInsightsPayment } from '@/hooks/use-InsightsPayment';
import { useChainManager } from '@/hooks/useChainManager';
import { parseUnits, formatUnits } from 'viem';
// Removed useBalance hook - using publicClient directly to avoid chain config issues
import { publicClient } from '@/lib/contract';
import { uploadToIPFS } from '@/lib/ipfs';

const CHECKIN_FEE = parseUnits('0.1', 18);

interface PaymentGateProps {
  checkInData: {
    answers: Record<string, string>;
    timestamp: string;
  };
  onPaymentComplete: () => void;
}

export const PaymentGate = ({ checkInData, onPaymentComplete }: PaymentGateProps) => {
  const { address, isConnected, chainId: wagmiChainId } = useAccount();
  const { chainId, isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const { status, isLoading, submitCheckin, isProcessing } = useInsightsPayment();
  const navigate = useNavigate();
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState<Error | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch balance manually using publicClient to avoid wagmi hook chain issues
  useEffect(() => {
    if (!isConnected || !address || !chainId || chainId !== 42220) {
      setBalance(null);
      setBalanceError(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const bal = await publicClient.getBalance({ address });
        setBalance(bal);
        setBalanceError(null);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalanceError(error as Error);
        setBalance(null);
      }
    };

    fetchBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [isConnected, address, chainId]);

  // Handle balance check with error handling
  const hasSufficientBalance = balance && !balanceError
    ? balance >= CHECKIN_FEE
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


  const handleOneOffPayment = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    // CRITICAL: Ensure we're on the correct chain BEFORE showing dialog
    if (!isOnCorrectChain) {
      toast.info('Switching to Celo network...');
      const switched = await ensureCorrectChain();
      if (!switched) {
        toast.error('Please switch to Celo network (chain ID: 42220) to continue');
        return;
      }
      // Wait a moment for chain switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Double-check chain after switch attempt
    if (chainId !== 42220) {
      toast.error('Please switch to Celo network (chain ID: 42220) to continue');
      return;
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. Need ${formatUnits(CHECKIN_FEE, 18)} CELO`);
      return;
    }

    // Show confirmation dialog before proceeding
    setShowConfirmDialog(true);
  };

  const confirmPayment = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      setShowConfirmDialog(false);
      return;
    }

    // CRITICAL: Verify chain before proceeding with transaction
    if (!isOnCorrectChain || chainId !== 42220) {
      toast.error('Please switch to Celo network (chain ID: 42220) to continue');
      const switched = await ensureCorrectChain();
      if (!switched) {
        setShowConfirmDialog(false);
        return;
      }
      // Wait for chain switch to complete and state to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Final check - get fresh chainId from wagmi (reactive) instead of closure
      // Use wagmiChainId which is reactive and will have the updated value
      const currentChainId = wagmiChainId || chainId;
      if (currentChainId !== 42220) {
        toast.error('Still not on Celo network. Please switch manually and try again.');
        setShowConfirmDialog(false);
        return;
      }
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. Need ${formatUnits(CHECKIN_FEE, 18)} CELO`);
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);

    try {
      setIsUploadingIPFS(true);
      
      // Upload check-in data to IPFS (optional - returns empty string if Pinata not configured)
      let ipfsHash = '';
      try {
        ipfsHash = await uploadToIPFS(checkInData);
        if (ipfsHash) {
          console.log('Check-in data uploaded to IPFS:', ipfsHash);
        } else {
          console.log('IPFS upload skipped (Pinata not configured). Data stored locally only.');
        }
      } catch (error) {
        console.warn('IPFS upload failed, continuing without IPFS hash:', error);
        ipfsHash = ''; // Continue without IPFS
      } finally {
        setIsUploadingIPFS(false);
      }
      
      // Submit check-in with fee (ipfsHash can be empty string if IPFS not available)
      const txHash = await submitCheckin(ipfsHash || 'local', true);
      
      toast.success('Payment successful!', {
        description: `Transaction: ${txHash}`,
      });

      // Wait a bit for contract state to update, then refetch
      // The submitCheckin already calls refetch, but we'll wait a bit more to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Call onPaymentComplete - it will handle analysis, saving to React state, and navigation
      // Don't navigate here - let the parent component handle it after analysis completes
      onPaymentComplete();
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Payment failed';
      if (message.includes('Daily limit reached')) {
        message = 'Daily limit reached: 2 check-ins per day. Please try again tomorrow.';
      } else if (message.includes('Please wait 5 hours')) {
        message = 'Please wait 5 hours between check-ins before trying again.';
      }
      toast.error(message);
    } finally {
      setIsUploadingIPFS(false);
    }
  };


  if (isLoading || isUploadingIPFS) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isLoading && 'Loading...'}
              {isUploadingIPFS && 'Uploading check-in data to IPFS...'}
            </p>
          </div>
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
            <CardTitle>Pay for Check-in</CardTitle>
          </div>
          <CardDescription>
            Pay 0.1 CELO to submit your check-in and view insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Daily limit info */}
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>
                <strong>2 check-ins available daily</strong> • {status.remainingCheckinsToday} remaining today
              </span>
            </AlertDescription>
          </Alert>
          {/* Payment Option */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Check-in Fee</CardTitle>
                <Badge variant="secondary">0.1 CELO</Badge>
              </div>
              <CardDescription>
                Pay to submit your check-in and view insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-mono">
                  {balance ? formatUnits(balance, 18) : '0'} CELO
                </span>
              </div>
              {!hasSufficientBalance && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Insufficient balance. You need {formatUnits(CHECKIN_FEE, 18)} CELO
                  </AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleOneOffPayment}
                disabled={!hasSufficientBalance || !isOnCorrectChain || chainId !== 42220 || isProcessing || isUploadingIPFS}
                className="w-full bg-gradient-celo hover:opacity-90"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {!isOnCorrectChain || chainId !== 42220
                  ? 'Switch to Celo Network'
                  : isProcessing || isUploadingIPFS
                  ? 'Processing...'
                  : `Pay ${formatUnits(CHECKIN_FEE, 18)} CELO`}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Confirm Payment
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <p className="text-base font-medium">
                  You are about to send <strong className="text-primary">0.1 CELO</strong> to submit your check-in.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">0.1 CELO</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-semibold">Celo (Chain ID: 42220)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Balance:</span>
                    <span className="font-semibold">
                      {balance ? formatUnits(balance, 18) : '0'} CELO
                    </span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPayment}
              className="bg-gradient-celo hover:opacity-90"
            >
              Confirm & Pay 0.1 CELO
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

