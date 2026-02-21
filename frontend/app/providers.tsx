'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import '@rainbow-me/rainbowkit/styles.css';
import ClientOnly from '../components/ClientOnly';

// Define ADI Testnet
export const adiTestnet = defineChain({
  id: 99999, // ADI testnet chain ID
  name: 'ADI Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ADI',
    symbol: 'ADI',
  },
  rpcUrls: {
    default: { http: ['https://rpc.ab.testnet.adifoundation.ai/'] },
  },
  blockExplorers: {
    default: { name: 'ADI Explorer', url: 'https://explorer.ab.testnet.adifoundation.ai/' },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: 'TARS DAO',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a1b2c3d4e5f6g7h8i9j0', // Optional: Get from https://cloud.walletconnect.com
  chains: [adiTestnet],
  transports: {
    [adiTestnet.id]: http(),
  },
  ssr: true, // Enable SSR support
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ClientOnly>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </ClientOnly>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
