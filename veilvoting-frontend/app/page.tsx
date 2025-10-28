"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useVeilVoting } from "../hooks/useVeilVoting";
import { useWallet } from "../hooks/useWallet";
import { ProposalCard } from "../components/ProposalCard";

export default function Home() {
  const { address } = useWallet();
  const { getProposalCount, getProposal } = useVeilVoting();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    loadProposals();
  }, [address]);

  async function loadProposals() {
    try {
      setLoading(true);
      const count = await getProposalCount();
      
      const proposalsData = [];
      // Load last 10 proposals
      const start = Math.max(0, count - 10);
      
      for (let i = count - 1; i >= start; i--) {
        const data = await getProposal(i);
        proposalsData.push({
          id: i,
          title: data.title,
          creator: data.creator,
          description: data.description,
          options: data.options,
          startTime: data.startTime,
          endTime: data.endTime,
          totalVoters: data.totalVoters,
          minVoters: data.minVoters,
          isRevealed: data.isRevealed,
        });
      }

      setProposals(proposalsData);
    } catch (error) {
      console.error("Failed to load proposals:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-2xl">
          <div className="text-6xl mb-6 animate-veil-float">🎭</div>
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Welcome to VeilVoting
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
            A privacy-preserving voting platform powered by FHEVM encryption.
            <br />
            Your votes stay encrypted on-chain until results are revealed.
          </p>
          <div className="flex gap-4 justify-center">
            <div className="glass-card p-4 text-left">
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="font-semibold mb-1">Encrypted Votes</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                All votes encrypted with FHEVM
              </p>
            </div>
            <div className="glass-card p-4 text-left">
              <div className="text-2xl mb-2">🗳️</div>
              <h3 className="font-semibold mb-1">Fair Results</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Results revealed after voting ends
              </p>
            </div>
            <div className="glass-card p-4 text-left">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">On-Chain</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Transparent and verifiable
              </p>
            </div>
          </div>
          <p className="mt-8 text-neutral-500 dark:text-neutral-400">
            Connect your wallet to get started →
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🎭</div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            Recent Proposals
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Browse and vote on active proposals
          </p>
        </div>
        <Link
          href="/proposals/create"
          className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium shadow-lg shadow-primary-500/30 transition-all"
        >
          Create Proposal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No proposals yet</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Be the first to create a proposal!
          </p>
          <Link
            href="/proposals/create"
            className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            Create First Proposal
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              id={proposal.id}
              title={proposal.title}
              creator={proposal.creator}
              endTime={Number(proposal.endTime)}
              totalVoters={Number(proposal.totalVoters)}
              minVoters={Number(proposal.minVoters)}
              isRevealed={proposal.isRevealed}
              optionsCount={proposal.options.length}
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/all-proposals"
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          View all proposals →
        </Link>
      </div>
    </div>
  );
}


