'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { WagmiProvider, http } from 'wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
} from 'wagmi/chains';


const ALCHEMY_KEY = "";
const WALLET_CONNECT_PROJECT_ID = "";

const queryClient = new QueryClient();


const config = getDefaultConfig({
  appName: 'WalletX',
  projectId: "" , 
  chains: [mainnet, sepolia, polygon, optimism, arbitrum],
  transports: {
    [mainnet.id]: http(``),
    [sepolia.id]: http(``),
    [polygon.id]: http(``),
    [optimism.id]: http(``),
    [arbitrum.id]: http(``),
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#22d3ee',
            accentColorForeground: 'black',
            borderRadius: 'large',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}