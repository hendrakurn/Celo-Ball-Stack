import type { Address } from "viem";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as
  | Address
  | undefined;

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 44787);

export const IS_MAINNET = CHAIN_ID === 42220;

export const SCORING = {
  pointsPerStack: 10,
  finishBonus: 500,
  timeBonusMax: 3000,
  timeBonusDivisor: 10,
  comboThreshold: 5,
  comboMultiplier: 1.5,
} as const;
