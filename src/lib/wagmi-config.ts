import { http, createConfig } from 'wagmi'
import { celo, celoAlfajores } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: 'YOUR_WALLETCONNECT_PROJECT_ID' // Users can get this from walletconnect.com
    }),
  ],
  transports: {
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
  },
})

// Smart contract address for insights payment (deploy contract and update this)
export const INSIGHTS_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

// ABI for the insights payment contract
export const INSIGHTS_CONTRACT_ABI = [
  {
    inputs: [],
    name: 'payForInsights',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'hasAccess',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
