"use client"

import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import {
  avalanche, avalancheFuji,
  arbitrum, arbitrumSepolia,
  base, baseSepolia,
  mainnet, sepolia,
  linea, lineaTestnet,
  sonic, sonicTestnet
} from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const queryClient = new QueryClient()
const projectId = '167323e11d383f7f87c04473435199c3'

const metadata = {
  name: 'test1',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit',
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

const lineaSepolia = {
  id: 59141,
  name: 'Linea Sepolia',
  network: 'linea-sepolia',
  nativeCurrency: { name: 'Linea Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
    public: { http: ['https://linea-sepolia.g.alchemy.com/v2/'] },
  },
  blockExplorers: {
    default: { name: 'LineaScan', url: 'https://sepolia.lineascan.build' },
  },
  contracts: {},
};

const networks = [
  avalanche, avalancheFuji,
  arbitrum, arbitrumSepolia,
  base, baseSepolia,
  mainnet, sepolia,
  linea, lineaTestnet,
  lineaSepolia,
  sonic, sonicTestnet
] as any

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  },
  optionalChains: [1, 42161, 11155111, 8453, 84532, 421614, 43113, 59141],
  rpcMap: {
    1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    42161: 'https://arbitrum-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    11155111: 'https://eth-sepolia.g.alchemy.com/v2/',
    84532: 'https://base-sepolia.g.alchemy.com/v2/',
    59141: 'https://linea-sepolia.g.alchemy.com/v2/',
  }
})

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
} 