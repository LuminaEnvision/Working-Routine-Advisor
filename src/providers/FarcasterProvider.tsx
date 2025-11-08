import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type FarcasterProfile = {
  fid: number;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followerCount?: number;
  followingCount?: number;
};

type FarcasterContextValue = {
  isAuthenticated: boolean;
  profile: FarcasterProfile | null;
  startSignIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const FarcasterContext = createContext<FarcasterContextValue | undefined>(
  undefined
);

const mapProfile = (user: any): FarcasterProfile => ({
  fid: user?.fid ?? 0,
  username: user?.username ?? "",
  displayName: user?.displayName ?? user?.username ?? "",
  avatarUrl: user?.pfpUrl ?? undefined,
  followerCount: user?.followerCount ?? undefined,
  followingCount: user?.followingCount ?? undefined,
});

const FarcasterSessionProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const profile = useMemo(() => {
    if (!user) return null;
    return mapProfile(user);
  }, [user]);

  const startSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      // Try to load Farcaster auth kit dynamically
      try {
        const authKit = await import("@farcaster/auth-kit");
        const useAuthKit = authKit.useAuthKit || authKit.default?.useAuthKit;
        
        if (useAuthKit) {
          // If useAuthKit is available, we'd need to use it in a hook context
          // For now, just show a message
          console.warn("Farcaster auth kit requires proper setup. Please configure WalletConnect Project ID.");
        }
      } catch (error) {
        console.warn("Farcaster auth kit not available:", error);
      }
      
      // For now, just set a placeholder
      console.warn("Farcaster sign-in not fully implemented. Please use Farcaster Mini App SDK for wallet connection.");
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn]);

  const signOut = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const contextValue = useMemo<FarcasterContextValue>(
    () => ({
      isAuthenticated,
      profile,
      startSignIn,
      signOut,
    }),
    [isAuthenticated, profile, signOut, startSignIn]
  );

  return (
    <FarcasterContext.Provider value={contextValue}>
      {children}
    </FarcasterContext.Provider>
  );
};

export const FarcasterProvider = ({ children }: { children: ReactNode }) => {
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

  // If no WalletConnect Project ID, skip Farcaster auth (optional feature)
  if (!walletConnectProjectId) {
    console.warn("VITE_WALLETCONNECT_PROJECT_ID not set. Farcaster auth will be disabled.");
    return (
      <FarcasterSessionProvider>
        {children}
      </FarcasterSessionProvider>
    );
  }

  // Try to load AuthKitProvider dynamically, but don't fail if it's not available
  try {
    // Lazy load the auth kit
    const loadAuthKit = async () => {
      try {
        const authKit = await import("@farcaster/auth-kit");
        return authKit.AuthKitProvider || authKit.default?.AuthKitProvider;
      } catch (error) {
        console.warn("Farcaster Auth Kit not available:", error);
        return null;
      }
    };

    // For now, just render children with session provider
    // The auth kit can be loaded later if needed
    return (
      <FarcasterSessionProvider>
        {children}
      </FarcasterSessionProvider>
    );
  } catch (error) {
    console.error("FarcasterProvider error:", error);
    // Fallback: render children without Farcaster auth
    return (
      <FarcasterSessionProvider>
        {children}
      </FarcasterSessionProvider>
    );
  }
};

export const useFarcaster = () => {
  const context = useContext(FarcasterContext);
  if (!context) {
    // Return default values instead of throwing to prevent app crashes
    return {
      isAuthenticated: false,
      profile: null,
      startSignIn: async () => {
        console.warn("Farcaster auth not available. Please set VITE_WALLETCONNECT_PROJECT_ID.");
      },
      signOut: () => {
        console.warn("Farcaster auth not available.");
      },
    };
  }
  return context;
};
