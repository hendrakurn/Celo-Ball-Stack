"use client";

import { createPublicClient, http, parseAbi } from "viem";
import { celo, celoAlfajores, celoSepolia } from "viem/chains";
import { CHAIN_ID } from "./constants";

export const STACK_BALL_ABI = parseAbi([
  "function startGame() external returns (bytes32 sessionId)",
  "function submitScore(uint256 totalScore, bytes32 gameHash) external",
  "function depositPrize() external payable",
  "function getLeaderboard() external view returns ((address player, uint256 score, uint256 rank, uint256 submittedAt)[])",
  "function getTimeUntilReset() external view returns (uint256)",
  "function getPlayerStats(address player) external view returns ((uint256 totalGames, uint256 bestScore, uint256 currentPeriodScore, uint256 currentRank, bool hasSubmittedThisPeriod))",
  "function getContractBalance() external view returns (uint256)",
  "function isPeriodExpired() external view returns (bool)",
  "function getPrizes() external view returns (uint256, uint256, uint256)",
  "function getLeaderboardTop3() external view returns (address, uint256, address, uint256, address, uint256)",
  "event GameStarted(address indexed player, bytes32 indexed sessionId, uint256 timestamp)",
  "event ScoreSubmitted(address indexed player, uint256 score, uint256 rank, uint256 periodNumber, uint256 timestamp)",
  "event RewardsDistributed(address indexed winner1, address indexed winner2, address indexed winner3, uint256 amount1, uint256 amount2, uint256 amount3, uint256 periodNumber)",
]);

export const celoChain =
  CHAIN_ID === celo.id
    ? celo
    : CHAIN_ID === celoSepolia.id
      ? celoSepolia
      : celoAlfajores;

const rpcUrl =
  celoChain.id === celo.id
    ? "https://forno.celo.org"
    : celoChain.id === celoSepolia.id
      ? "https://forno.celo-sepolia.celo-testnet.org"
      : "https://alfajores-forno.celo-testnet.org";

export const publicClient = createPublicClient({
  chain: celoChain,
  transport: http(rpcUrl),
});
