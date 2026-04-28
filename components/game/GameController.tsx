"use client";

import { useWallet } from "@/hooks/useWallet";
import { useGame } from "@/hooks/useGame";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatAddress } from "@/lib/minipay";
import type { RoundResult } from "@/lib/scoring";
import { StackBallEntry } from "@/app/components/game/stack-ball-entry";

export function GameController() {
  const { address, isConnected } = useWallet();
  const {
    phase,
    totalScore,
    roundCount,
    resetToken,
    txError,
    startGame,
    continueGame,
    submitScore,
    onRoundEnd,
    resetSession,
  } = useGame();

  const enabled = phase === "playing";

  const handleRoundEnd = (result: RoundResult) => {
    onRoundEnd(result);
  };

  return (
    <div className="stackball-onchainStage">
      <StackBallEntry
        enabled={enabled}
        resetToken={resetToken}
        onRoundEnd={handleRoundEnd}
      />

      {phase === "idle" && isConnected ? (
        <>
          <button
            type="button"
            className="stackball-startGate"
            onClick={startGame}
            disabled={!CONTRACT_ADDRESS}
            aria-label="Start game onchain"
          />
          {!CONTRACT_ADDRESS ? (
            <div className="stackball-configNotice">
              Set NEXT_PUBLIC_CONTRACT_ADDRESS after deployment.
            </div>
          ) : null}
        </>
      ) : null}

      {phase === "starting" ? (
        <div className="stackball-chainOverlay">
          <strong>Confirming...</strong>
          <span>Approve the start transaction in your wallet.</span>
          {txError ? <p>{txError}</p> : null}
        </div>
      ) : null}

      {phase === "round_over" ? (
        <div className="stackball-chainOverlay stackball-roundOverlay">
          <span>
            Total score - all {roundCount} round{roundCount === 1 ? "" : "s"}
          </span>
          <strong className="stackball-totalScore">
            {totalScore.toLocaleString()}
          </strong>
          {txError ? <p>{txError}</p> : null}
          <div className="stackball-actionRow">
            <button type="button" className="stackball-secondary" onClick={continueGame}>
              Lanjut Main
              <small>Gas fee required</small>
            </button>
            <button type="button" className="stackball-primary" onClick={submitScore}>
              Submit Skor
              <small>Gas fee required</small>
            </button>
          </div>
          <small>{formatAddress(address ?? "")} on Celo</small>
        </div>
      ) : null}

      {phase === "submitting" ? (
        <div className="stackball-chainOverlay">
          <strong>Submitting Score...</strong>
          <b className="stackball-totalScore">{totalScore.toLocaleString()}</b>
          <span>Approve the transaction to save your score onchain.</span>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="stackball-chainOverlay">
          <strong>Score Submitted</strong>
          <b className="stackball-totalScore">{totalScore.toLocaleString()}</b>
          <span>Your score is now on the Celo leaderboard.</span>
          <button type="button" className="stackball-primary" onClick={resetSession}>
            Play Again
          </button>
        </div>
      ) : null}
    </div>
  );
}
