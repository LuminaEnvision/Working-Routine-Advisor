import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const { address, isConnected, chainId } = useAccount();
  const { isOnCorrectChain, ensureCorrectChain } = useChainManager();
  const { status, isLoading, submitCheckin, isProcessing, checkCooldown } = useInsightsPayment();
  const navigate = useNavigate();
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceError, setBalanceError] = useState<Error | null>(null);

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

    if (!isOnCorrectChain) {
      const switched = await ensureCorrectChain();
      if (!switched) return;
    }

    if (!hasSufficientBalance) {
      toast.error(`Insufficient balance. Need ${formatUnits(CHECKIN_FEE, 18)} CELO`);
      return;
    }

    try {
      setIsCheckingCooldown(true);
      
      // Check cooldown first
      await checkCooldown();
      
      setIsUploadingIPFS(true);
      
      // Upload check-in data to IPFS
      const ipfsHash = await uploadToIPFS(checkInData);
      
      // Submit check-in with fee
      const txHash = await submitCheckin(ipfsHash, true);
      
      toast.success('Payment successful!', {
        description: `Transaction: ${txHash}`,
      });

      // Save to localStorage
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '[]');
      checkIns.push({ ...checkInData, ipfsHash });
      localStorage.setItem('checkIns', JSON.stringify(checkIns));

      // Navigate first to avoid state update during navigation
      navigate('/recommendations');
      
      // Call onPaymentComplete after navigation to clean up state
      // Use requestAnimationFrame to ensure navigation completes first
      requestAnimationFrame(() => {
        onPaymentComplete();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      toast.error(message);
    } finally {
      setIsCheckingCooldown(false);
      setIsUploadingIPFS(false);
    }
  };


  // Show cooldown message if in cooldown
  if (status.isInCooldown) {
    return (
      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-warning" />
            Check-in Cooldown
          </CardTitle>
          <CardDescription>
            You already checked in today. Please wait before checking in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You can check in again in <strong>{status.hoursUntilNextCheckin} hours</strong>.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => navigate('/recommendations')}
            className="w-full"
            variant="outline"
          >
            View Previous Insights
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || isCheckingCooldown || isUploadingIPFS) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isLoading && 'Loading...'}
              {isCheckingCooldown && 'Checking cooldown status...'}
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
                disabled={!hasSufficientBalance || isProcessing || isCheckingCooldown || isUploadingIPFS}
                className="w-full bg-gradient-celo hover:opacity-90"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isProcessing || isCheckingCooldown || isUploadingIPFS
                  ? 'Processing...'
                  : `Pay ${formatUnits(CHECKIN_FEE, 18)} CELO`}
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

