"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { formatAddress } from "@/lib/minipay";

export function LeaderboardTable() {
  const { entries, isLoading, countdownDisplay, playerRank, top3 } =
    useLeaderboard();

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="stackball-leaderboard">
        <div className="stackball-leaderboardTitle">Leaderboard</div>
        <div className="stackball-empty">Set NEXT_PUBLIC_CONTRACT_ADDRESS.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="stackball-leaderboard">
        <div className="stackball-empty">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="stackball-leaderboard">
      <div className="stackball-leaderboardHeader">
        <div className="stackball-leaderboardTitle">Leaderboard</div>
        <div className="stackball-leaderboardMeta">
          Resets in {countdownDisplay || "Loading..."}
        </div>
        {playerRank ? (
          <div className="stackball-leaderboardRank">Your rank #{playerRank}</div>
        ) : null}
      </div>

      <div className="stackball-prizes">
        {["1st 15 CELO", "2nd 13 CELO", "3rd 10 CELO"].map((prize, index) => (
          <div key={prize}>
            <strong>{prize}</strong>
            <span>{top3[index] ? formatAddress(top3[index].player) : "TBD"}</span>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="stackball-empty">No scores yet.</div>
      ) : (
        <div className="stackball-leaderboardRows">
          {entries.map((entry) => (
            <div
              className={
                entry.isCurrentUser
                  ? "stackball-leaderboardRow is-current"
                  : "stackball-leaderboardRow"
              }
              key={entry.player}
            >
              <span className="stackball-rowRank">#{entry.rank}</span>
              <span className="stackball-rowAddress">
                {formatAddress(entry.player)}
                {entry.isCurrentUser ? <em>YOU</em> : null}
              </span>
              <strong>{entry.score.toLocaleString()}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
