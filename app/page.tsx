"use client";

import { GameController } from "@/components/game/GameController";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const { isConnected, isMiniPayUser, connectWallet, isConnecting } =
    useWallet();

  if (isMiniPayUser && !isConnected) {
    return (
      <main className="stackball-connectShell">
        <div className="stackball-connectPanel">Connecting MiniPay...</div>
      </main>
    );
  }

  if (!isConnected) {
    return (
      <main className="stackball-connectShell">
        <section className="stackball-connectPanel">
          <p className="stackball-kicker">Onchain arcade</p>
          <h1>Stack Ball Celo</h1>
          <p className="stackball-connectCopy">
            Break stacks. Submit your score. Top 3 win CELO every 3 days.
          </p>
          <div className="stackball-prizeStrip" aria-label="Prize pool">
            <span>1st 15 CELO</span>
            <span>2nd 13 CELO</span>
            <span>3rd 10 CELO</span>
          </div>
          {!isMiniPayUser ? (
            <button
              type="button"
              className="stackball-connectButton"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet to Play"}
            </button>
          ) : null}
          <small>Pay only gas fee</small>
        </section>
        <LeaderboardTable />
      </main>
    );
  }

  return <GameController />;
}
