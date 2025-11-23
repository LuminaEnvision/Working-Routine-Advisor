/// <reference types="vite/client" />

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, handler: (data: any) => void) => void;
    removeListener: (event: string, handler: (data: any) => void) => void;
    isMetaMask?: boolean;
  };
  farcaster?: {
    sdk?: any;
    wallet?: any;
    ready?: () => Promise<void> | void;
    sdk?: {
      actions?: {
        ready?: () => Promise<void>;
      };
      context?: any;
      wallet?: {
        getEthereumProvider?: () => any;
        request?: (args: { method: string; params?: any[] }) => Promise<any>;
        on?: (event: string, handler: (data: any) => void) => void;
      };
    };
    wallet?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (data: any) => void) => void;
      removeListener?: (event: string, handler: (data: any) => void) => void;
    };
    context?: any;
  };
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
}
