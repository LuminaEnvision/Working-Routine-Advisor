import { createConfig } from "wagmi";
import { http } from "viem";
import { celo, celoAlfajores } from "wagmi/chains";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { SafeConnector } from "wagmi/connectors/safe";
import { InjectedConnector } from "wagmi/connectors/injected";
import { createFarcasterConnector } from "./farcaster-connector";
import { isFarcasterMiniApp, getFarcasterWalletProvider } from "./farcaster-miniapp";

const rpcUrl = import.meta.env.VITE_CELO_RPC_URL ?? "https://forno.celo.org";
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

// Use mainnet (no testnet addresses provided)
const targetChain = celo;

const appMetadata = {
  name: "Working Routine Advisor",
  icon: "https://farcaster-working-routine-advisor.app/icon.png",
};

const connectors = [];

// 1. Farcaster connector (always add if in Farcaster context, or as fallback)
// Try to create Farcaster connector - it will return null if not in Farcaster context
const farcasterConn = createFarcasterConnector([targetChain]);
if (farcasterConn) {
  connectors.push(farcasterConn);
}

// Also add InjectedConnector for Farcaster wallet (if available)
// This will catch Farcaster wallet even if createFarcasterConnector returns null
if (typeof window !== 'undefined') {
  // Check if Farcaster wallet is available
  const hasFarcasterWallet = window.farcaster?.wallet || window.farcaster?.sdk;
  if (hasFarcasterWallet) {
    connectors.push(
      new InjectedConnector({
        chains: [targetChain],
        options: {
          name: 'Farcaster Wallet',
          shimDisconnect: true,
          getProvider: async () => {
            // Try to get Farcaster wallet provider
            try {
              const { getFarcasterWalletProvider } = await import('./farcaster-miniapp');
              const provider = await getFarcasterWalletProvider();
              if (provider) return provider;
            } catch (e) {
              // Fallback to window.farcaster.wallet if available
              if (window.farcaster?.wallet) {
                return window.farcaster.wallet;
              }
            }
            return window.ethereum;
          },
        },
      })
    );
  }
}

// 2. MetaMask (for standalone web app)
// Always add MetaMask connector - it will check if MetaMask is installed
connectors.push(
  new MetaMaskConnector({
    chains: [targetChain],
    options: {
      shimDisconnect: true,
      UNSTABLE_shimOnConnectSelectAccount: true,
    },
  })
);

// 2b. Injected connector as fallback (for other injected wallets like Brave, etc.)
// This will also catch MetaMask if MetaMaskConnector doesn't work
if (typeof window !== 'undefined' && window.ethereum) {
  connectors.push(
    new InjectedConnector({
      chains: [targetChain],
      options: {
        name: (window.ethereum as any).isMetaMask ? 'MetaMask' : 'Injected',
        shimDisconnect: true,
      },
    })
  );
}

// 3. WalletConnect (for mobile wallets)
if (walletConnectProjectId) {
  connectors.push(
    new WalletConnectConnector({
      chains: [targetChain],
      options: {
        projectId: walletConnectProjectId,
        showQrModal: true,
        metadata: appMetadata,
      },
    })
  );
}

// 4. Safe connector
connectors.push(
  new SafeConnector({
    chains: [targetChain],
    options: {
      allowedDomains: [/app.safe.global$/],
      debug: false,
    },
  })
);

export const wagmiConfig = createConfig({
  chains: [targetChain],
  connectors,
  transports: {
    [targetChain.id]: http(rpcUrl),
  },
});
