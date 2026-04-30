"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/minipay";

export function GameNav() {
  const { address, isConnected, isConnecting, connectWallet } = useWallet();

  return (
    <nav className="stackball-gameNav" aria-label="Game navigation">
      {isConnected ? (
        <span className="stackball-gameNavWallet">
          {formatAddress(address ?? "")}
        </span>
      ) : (
        <button
          type="button"
          className="stackball-gameNavButton"
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting" : "Connect"}
        </button>
      )}
      <Link className="stackball-gameNavButton" href="/leaderboard">
        Leaderboard
      </Link>
      <Link className="stackball-gameNavButton" href="/profile">
        Profile
      </Link>
    </nav>
  );
}
