"use client";

import Link from "next/link";
import { shortenAddress, calculateTimeRemaining } from "../lib/utils";

interface ProposalCardProps {
  id: number;
  title: string;
  creator: string;
  endTime: number;
  totalVoters: number;
  minVoters: number;
  isRevealed: boolean;
  optionsCount: number;
}

export function ProposalCard({
  id,
  title,
  creator,
  endTime,
  totalVoters,
  minVoters,
  isRevealed,
  optionsCount,
}: ProposalCardProps) {
  const { isEnded, formatted } = calculateTimeRemaining(Number(endTime));

  return (
    <Link href={`/proposals/${id}`}>
      <div className="group relative bg-white/90 dark:bg-neutral-800/90 backdrop-blur-lg border border-primary-100 dark:border-primary-900/20 rounded-xl p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1">
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {isEnded ? (
            isRevealed ? (
              <span className="px-3 py-1 bg-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                Revealed
              </span>
            ) : (
              <span className="px-3 py-1 bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-full">
                Ended
              </span>
            )
          ) : (
            <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-medium rounded-full animate-pulse">
              Active
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3 pr-20 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>

        {/* Creator */}
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          by {shortenAddress(creator)}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Voters:</span>{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {totalVoters}/{minVoters}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">Options:</span>{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {optionsCount}
              </span>
            </div>
          </div>
          <div className={isEnded ? "text-neutral-500" : "text-primary-600 dark:text-primary-400 font-medium"}>
            {formatted}
          </div>
        </div>
      </div>
    </Link>
  );
}


