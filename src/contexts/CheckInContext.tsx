import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { CheckInData } from '@/lib/ai';

interface CheckInContextType {
  checkIns: CheckInData[];
  addCheckIn: (checkIn: CheckInData) => void;
  getPreviousCheckIn: () => CheckInData | undefined;
  getHistoricalData: (days: number) => CheckInData[];
}

const CheckInContext = createContext<CheckInContextType | undefined>(undefined);

const STORAGE_KEY = 'wra_checkins';

export function CheckInProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load check-ins from localStorage on mount and when address changes
  useEffect(() => {
    if (!address) {
      setCheckIns([]);
      setIsLoaded(true);
      return;
    }

    try {
      const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as CheckInData[];
        // Validate and sort by timestamp
        const validCheckIns = parsed
          .filter(ci => ci && ci.timestamp)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setCheckIns(validCheckIns);
      } else {
        setCheckIns([]);
      }
    } catch (error) {
      console.error('Failed to load check-ins from localStorage:', error);
      setCheckIns([]);
    } finally {
      setIsLoaded(true);
    }
  }, [address]);

  // Save check-ins to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded || !address) return;

    try {
      const storageKey = `${STORAGE_KEY}_${address.toLowerCase()}`;
      localStorage.setItem(storageKey, JSON.stringify(checkIns));
    } catch (error) {
      console.error('Failed to save check-ins to localStorage:', error);
    }
  }, [checkIns, address, isLoaded]);

  const addCheckIn = (checkIn: CheckInData) => {
    setCheckIns((prev) => {
      const updated = [...prev, checkIn];
      // Sort by timestamp to keep them in order
      return updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
  };

  const getPreviousCheckIn = (): CheckInData | undefined => {
    if (checkIns.length === 0) return undefined;
    return checkIns[checkIns.length - 1];
  };

  const getHistoricalData = (days: number): CheckInData[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return checkIns.filter((checkIn) => {
      const checkInDate = new Date(checkIn.timestamp);
      return checkInDate >= cutoffDate;
    });
  };

  return (
    <CheckInContext.Provider
      value={{
        checkIns,
        addCheckIn,
        getPreviousCheckIn,
        getHistoricalData,
      }}
    >
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIns() {
  const context = useContext(CheckInContext);
  if (context === undefined) {
    throw new Error('useCheckIns must be used within a CheckInProvider');
  }
  return context;
}

