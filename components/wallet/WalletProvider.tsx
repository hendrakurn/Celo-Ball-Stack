"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "@wagmi/connectors";
import { type EIP1193Provider, http } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { WagmiProvider, createConfig } from "wagmi";
import { CHAIN_ID } from "@/lib/constants";

const chains =
  CHAIN_ID === celo.id
    ? ([celo, celoAlfajores, celoSepolia] as const)
    : CHAIN_ID === celoSepolia.id
      ? ([celoSepolia, celo, celoAlfajores] as const)
      : ([celoAlfajores, celo, celoSepolia] as const);

type MiniPayProvider = EIP1193Provider & {
  isMiniPay?: boolean;
  providers?: MiniPayProvider[];
};

const miniPayConnector = injected({
  shimDisconnect: false,
  target: {
    id: "miniPay",
    name: "MiniPay",
    provider(window) {
      const ethereum = window?.ethereum as MiniPayProvider | undefined;

      if (ethereum?.providers) {
        return ethereum.providers.find(
          (provider) => provider.isMiniPay,
        );
      }

      return ethereum?.isMiniPay ? ethereum : undefined;
    },
  },
});

const config = createConfig({
  chains,
  connectors: [
    miniPayConnector,
    injected({
      target: "rabby",
      shimDisconnect: false,
    }),
    injected({
      target: "metaMask",
      shimDisconnect: false,
    }),
    injected({
      shimDisconnect: false,
    }),
  ],
  transports: {
    [celo.id]: http("https://forno.celo.org"),
    [celoAlfajores.id]: http("https://alfajores-forno.celo-testnet.org"),
    [celoSepolia.id]: http("https://forno.celo-sepolia.celo-testnet.org"),
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000 },
  },
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
