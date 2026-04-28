"use client";

import { useCallback, useEffect, useState } from "react";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { publicClient, STACK_BALL_ABI } from "@/lib/contract";
import { formatCountdown } from "@/lib/minipay";
import { useWallet } from "./useWallet";

export interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  submittedAt: number;
  isCurrentUser: boolean;
}

export function useLeaderboard() {
  const { address } = useWallet();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(CONTRACT_ADDRESS));
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!CONTRACT_ADDRESS) {
      setIsLoading(false);
      return;
    }

    try {
      const [lb, timeLeft] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: STACK_BALL_ABI,
          functionName: "getLeaderboard",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: STACK_BALL_ABI,
          functionName: "getTimeUntilReset",
        }),
      ]);

      const mapped: LeaderboardEntry[] = lb.map((entry, index) => ({
        rank: Number(entry.rank || BigInt(index + 1)),
        player: entry.player,
        score: Number(entry.score),
        submittedAt: Number(entry.submittedAt),
        isCurrentUser: address?.toLowerCase() === entry.player.toLowerCase(),
      }));

      setEntries(mapped);
      setSecondsLeft(Number(timeLeft));
      setPlayerRank(mapped.find((entry) => entry.isCurrentUser)?.rank ?? null);
    } catch (error) {
      console.error("Leaderboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timeout = window.setTimeout(fetchLeaderboard, 0);
    const interval = window.setInterval(fetchLeaderboard, 15_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (secondsLeft <= 0) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [secondsLeft]);

  return {
    entries,
    isLoading,
    playerRank,
    countdownDisplay: formatCountdown(secondsLeft),
    secondsLeft,
    refresh: fetchLeaderboard,
    top3: entries.slice(0, 3),
  };
}
