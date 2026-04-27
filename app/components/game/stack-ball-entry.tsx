"use client";

import dynamic from "next/dynamic";

export const StackBallEntry = dynamic(
  () => import("./stack-ball-engine").then((module) => module.StackBallEngine),
  {
    ssr: false,
    loading: () => <main className="stackball-engine" />,
  },
);
