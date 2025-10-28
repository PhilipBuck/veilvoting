"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "../../hooks/useWallet";
import { useVeilVoting } from "../../hooks/useVeilVoting";
import { calculateTimeRemaining, shortenAddress } from "../../lib/utils";

interface VotingRecord {
  proposalId: number;
  title: string;
  creator: string;
  endTime: number;
  isRevealed: boolean;
  optionsCount: number;
}

export default function HistoryPage() {
  const { address } = useWallet();
  const { getProposalCount, getProposal, hasVoted } = useVeilVoting();
  const [votingHistory, setVotingHistory] = useState<VotingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      loadVotingHistory();
    }
  }, [address]);

  async function loadVotingHistory() {
    try {
      setLoading(true);
      const count = await getProposalCount();
      
      const history: VotingRecord[] = [];
      
      // Check all proposals to find ones the user voted on
      for (let i = 0; i < count; i++) {
        const voted = await hasVoted(i, address!);
        
        if (voted) {
          const data = await getProposal(i);
          history.push({
            proposalId: i,
            title: data.title,
            creator: data.creator,
            endTime: Number(data.endTime),
            isRevealed: data.isRevealed,
            optionsCount: data.options.length,
          });
        }
      }

      setVotingHistory(history);
    } catch (error) {
      console.error("Failed to load voting history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!address) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🔒</div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please connect your wallet to view your voting history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 animate-spin">🎭</div>
        <p className="text-neutral-600 dark:text-neutral-400">Loading your voting history...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">My Voting History</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Proposals you have participated in
        </p>
      </div>

      {votingHistory.length === 0 ? (
        <div className="glass-card rounded-xl p-16 text-center">
          <div className="text-6xl mb-4">🗳️</div>
          <h3 className="text-xl font-semibold mb-2">No voting history yet</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Start participating in proposals to build your voting history
          </p>
          <Link
            href="/all-proposals"
            className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Browse Proposals
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Total votes cast: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{votingHistory.length}</span>
          </div>
          
          <div className="space-y-4">
            {votingHistory.map((record) => {
              const { isEnded, formatted } = calculateTimeRemaining(record.endTime);
              
              return (
                <Link
                  key={record.proposalId}
                  href={`/proposals/${record.proposalId}`}
                  className="block"
                >
                  <div className="glass-card rounded-xl p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                          {record.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Created by {shortenAddress(record.creator)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {record.isRevealed ? (
                          <span className="px-3 py-1 bg-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full">
                            ✅ Results Revealed
                          </span>
                        ) : isEnded ? (
                          <span className="px-3 py-1 bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-full">
                            ⏸️ Ended
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-500/20 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                            ✅ Voted
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">Options:</span>{" "}
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {record.optionsCount}
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
            })}
          </div>
        </div>
      )}
    </div>
  );
}


