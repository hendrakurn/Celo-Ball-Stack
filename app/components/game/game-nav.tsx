"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/minipay";

export function GameNav() {
  const {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    walletOptions,
    activeConnectorName,
  } = useWallet();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <nav className="stackball-gameNav stackball-gameNavDesktop" aria-label="Game navigation">
        {isConnected ? (
          <span className="stackball-gameNavWallet">
            {formatAddress(address ?? "")}
            {activeConnectorName ? (
              <small>{activeConnectorName}</small>
            ) : null}
          </span>
        ) : (
          <div className="stackball-inlineWalletOptions">
            {(walletOptions.length > 0 ? walletOptions : [{ id: "default", name: "Wallet", isReady: true }]).map((wallet) => (
              <button
                key={wallet.id}
                type="button"
                className="stackball-gameNavButton"
                onClick={() => connectWallet(wallet.id === "default" ? undefined : wallet.id)}
                disabled={isConnecting || !wallet.isReady}
              >
                {isConnecting ? "Connecting" : wallet.name}
              </button>
            ))}
          </div>
        )}
        <Link className="stackball-gameNavButton" href="/leaderboard">
          Leaderboard
        </Link>
        <Link className="stackball-gameNavButton" href="/profile">
          Profile
        </Link>
      </nav>

      <div className="stackball-gameNavMobile">
        <button
          type="button"
          className="stackball-hamburgerButton"
          aria-label={isDrawerOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isDrawerOpen}
          aria-controls="stackball-mobile-drawer"
          onClick={() => setIsDrawerOpen(true)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div
        className={`stackball-drawerBackdrop${isDrawerOpen ? " is-open" : ""}`}
        aria-hidden={!isDrawerOpen}
        onClick={closeDrawer}
      />

      <aside
        id="stackball-mobile-drawer"
        className={`stackball-gameDrawer${isDrawerOpen ? " is-open" : ""}`}
        aria-hidden={!isDrawerOpen}
      >
        <div className="stackball-gameDrawerHeader">
          <strong>Menu</strong>
          <button
            type="button"
            className="stackball-gameDrawerClose"
            aria-label="Close navigation menu"
            onClick={closeDrawer}
          >
            <span />
            <span />
          </button>
        </div>

        <div className="stackball-gameDrawerBody">
          {isConnected ? (
            <span className="stackball-gameNavWallet stackball-gameDrawerWallet">
              {formatAddress(address ?? "")}
              {activeConnectorName ? (
                <small>{activeConnectorName}</small>
              ) : null}
            </span>
          ) : (
            <div className="stackball-drawerWalletOptions">
              {(walletOptions.length > 0 ? walletOptions : [{ id: "default", name: "Wallet", isReady: true }]).map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  className="stackball-gameNavButton stackball-gameDrawerButton"
                  onClick={() => {
                    closeDrawer();
                    connectWallet(wallet.id === "default" ? undefined : wallet.id);
                  }}
                  disabled={isConnecting || !wallet.isReady}
                >
                  {isConnecting ? "Connecting" : `Connect ${wallet.name}`}
                </button>
              ))}
            </div>
          )}
          <Link
            className="stackball-gameNavButton stackball-gameDrawerButton"
            href="/leaderboard"
            onClick={closeDrawer}
          >
            Leaderboard
          </Link>
          <Link
            className="stackball-gameNavButton stackball-gameDrawerButton"
            href="/profile"
            onClick={closeDrawer}
          >
            Profile
          </Link>
        </div>
      </aside>
    </>
  );
}
