"use client";

import { useCallback, useRef, useState } from "react";
import { useWriteContract } from "wagmi";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { STACK_BALL_ABI } from "@/lib/contract";
import {
  generateGameHash,
  totalAccumulatedScore,
  type GameAction,
  type RoundResult,
} from "@/lib/scoring";
import { useWallet } from "./useWallet";

export type GamePhase =
  | "idle"
  | "starting"
  | "playing"
  | "round_over"
  | "submitting"
  | "done";

export function useGame() {
  const { address } = useWallet();
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const [txError, setTxError] = useState<string | null>(null);
  const allActions = useRef<GameAction[]>([]);
  const { writeContractAsync } = useWriteContract();

  const startGame = useCallback(async () => {
    if (!address) return;
    if (!CONTRACT_ADDRESS) {
      setTxError("Contract address is not configured");
      return;
    }

    setTxError(null);
    setPhase("starting");

    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: STACK_BALL_ABI,
        functionName: "startGame",
      });

      setSessionId(`${address}-${hash}-${Date.now()}`);
      setResetToken((token) => token + 1);
      setPhase("playing");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction rejected";
      setTxError(message);
      setPhase(rounds.length > 0 ? "round_over" : "idle");
    }
  }, [address, rounds.length, writeContractAsync]);

  const recordAction = useCallback((action: GameAction) => {
    allActions.current.push(action);
  }, []);

  const onRoundEnd = useCallback((result: RoundResult) => {
    setRounds((prev) => [...prev, result]);
    allActions.current.push(...result.actions);
    setPhase("round_over");
  }, []);

  const continueGame = useCallback(async () => {
    await startGame();
  }, [startGame]);

  const submitScore = useCallback(async () => {
    if (!address) return;
    if (!CONTRACT_ADDRESS) {
      setTxError("Contract address is not configured");
      return;
    }

    const total = totalAccumulatedScore(rounds);
    if (total <= 0) {
      setTxError("Score must be greater than zero");
      return;
    }

    setTxError(null);
    setPhase("submitting");

    const gameHash = generateGameHash(address, sessionId, allActions.current);

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: STACK_BALL_ABI,
        functionName: "submitScore",
        args: [BigInt(total), gameHash],
      });
      setPhase("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submit failed";
      setTxError(message);
      setPhase("round_over");
    }
  }, [address, rounds, sessionId, writeContractAsync]);

  const resetSession = useCallback(() => {
    setPhase("idle");
    setRounds([]);
    setSessionId("");
    setTxError(null);
    allActions.current = [];
    setResetToken((token) => token + 1);
  }, []);

  return {
    phase,
    rounds,
    totalScore: totalAccumulatedScore(rounds),
    roundCount: rounds.length,
    resetToken,
    txError,
    startGame,
    continueGame,
    submitScore,
    onRoundEnd,
    recordAction,
    resetSession,
  };
}
