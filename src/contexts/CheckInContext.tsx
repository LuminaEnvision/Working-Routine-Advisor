import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckInData } from '@/lib/ai';

interface CheckInContextType {
  checkIns: CheckInData[];
  addCheckIn: (checkIn: CheckInData) => void;
  getPreviousCheckIn: () => CheckInData | undefined;
  getHistoricalData: (days: number) => CheckInData[];
}

const CheckInContext = createContext<CheckInContextType | undefined>(undefined);

export function CheckInProvider({ children }: { children: ReactNode }) {
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);

  const addCheckIn = (checkIn: CheckInData) => {
    setCheckIns((prev) => [...prev, checkIn]);
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

