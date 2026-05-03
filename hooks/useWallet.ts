"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
  useAccount,
  useChainId,
  useConnect,
  useConnections,
  useConnectors,
  useSwitchChain,
} from "wagmi";
import { CHAIN_ID } from "@/lib/constants";
import { isMiniPay } from "@/lib/minipay";

export type WalletOption = {
  id: string;
  name: string;
  isReady: boolean;
};

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, error: connectError, isPending: isConnecting } = useConnect();
  const connectors = useConnectors();
  const connections = useConnections();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const autoConnectedRef = useRef(false);
  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isMiniPayUser = isReady && isMiniPay();
  const activeConnector = connections[0]?.connector;

  const walletOptions = useMemo(() => {
    const seen = new Set<string>();

    return connectors
      .filter((connector) => {
        const key = `${connector.id}:${connector.name}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .map((connector) => ({
        id: connector.id,
        name: connector.name,
        isReady: connector.type === "injected" ? connector.ready !== false : true,
      }))
      .filter((connector) => {
        if (isMiniPayUser) {
          return connector.id === "miniPay";
        }

        return connector.id !== "miniPay";
      });
  }, [connectors, isMiniPayUser]);

  const connectWallet = useCallback(
    (walletId?: string) => {
      const fallbackId = isMiniPayUser
        ? "miniPay"
        : walletOptions.find((option) => option.id === "rabby")?.id ??
          walletOptions.find((option) => option.id === "metaMask")?.id ??
          walletOptions[0]?.id;
      const targetId = walletId ?? fallbackId;
      const connector = connectors.find((item) => item.id === targetId);

      if (!connector) {
        return;
      }

      connect({ connector });
    },
    [connect, connectors, isMiniPayUser, walletOptions],
  );

  useEffect(() => {
    if (isMiniPayUser && !isConnected && !autoConnectedRef.current) {
      autoConnectedRef.current = true;
      connectWallet("miniPay");
    }
  }, [connectWallet, isConnected, isMiniPayUser]);

  useEffect(() => {
    if (isConnected && chainId !== CHAIN_ID) {
      switchChain({ chainId: CHAIN_ID });
    }
  }, [chainId, isConnected, switchChain]);

  return {
    address,
    chainId,
    isReady,
    isConnected,
    isConnecting,
    isMiniPayUser,
    isCorrectChain: chainId === CHAIN_ID,
    activeConnectorId: activeConnector?.id ?? null,
    activeConnectorName: activeConnector?.name ?? null,
    walletOptions,
    connectError: connectError?.message ?? null,
    connectWallet,
  };
}
