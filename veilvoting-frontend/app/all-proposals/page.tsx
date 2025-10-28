"use client";

import { useEffect, useState } from "react";
import { useVeilVoting } from "../../hooks/useVeilVoting";
import { useWallet } from "../../hooks/useWallet";
import { ProposalCard } from "../../components/ProposalCard";

export default function AllProposalsPage() {
  const { address } = useWallet();
  const { getProposalCount, getProposal } = useVeilVoting();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "ended" | "revealed">("all");

  useEffect(() => {
    if (address) {
      loadProposals();
    }
  }, [address]);

  async function loadProposals() {
    try {
      setLoading(true);
      const count = await getProposalCount();
      
      const proposalsData = [];
      
      // Load all proposals (newest first)
      for (let i = count - 1; i >= 0; i--) {
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

  const filteredProposals = proposals.filter((p) => {
    const now = Math.floor(Date.now() / 1000);
    const isActive = now >= p.startTime && now < p.endTime;
    const isEnded = now >= p.endTime;

    if (filter === "active") return isActive;
    if (filter === "ended") return isEnded && !p.isRevealed;
    if (filter === "revealed") return p.isRevealed;
    return true; // all
  });

  if (!address) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🔒</div>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please connect your wallet to view proposals
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 animate-spin">🎭</div>
        <p className="text-neutral-600 dark:text-neutral-400">Loading all proposals...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">All Proposals</h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Browse all voting proposals on the platform
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "all"
              ? "bg-primary-500 text-white"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          All ({proposals.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "active"
              ? "bg-primary-500 text-white"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          🟢 Active ({proposals.filter(p => {
            const now = Math.floor(Date.now() / 1000);
            return now >= p.startTime && now < p.endTime;
          }).length})
        </button>
        <button
          onClick={() => setFilter("ended")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "ended"
              ? "bg-primary-500 text-white"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          ⏸️ Ended ({proposals.filter(p => {
            const now = Math.floor(Date.now() / 1000);
            return now >= p.endTime && !p.isRevealed;
          }).length})
        </button>
        <button
          onClick={() => setFilter("revealed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
            filter === "revealed"
              ? "bg-primary-500 text-white"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700"
          }`}
        >
          ✅ Revealed ({proposals.filter(p => p.isRevealed).length})
        </button>
      </div>

      {filteredProposals.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No proposals found</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {filter === "all" ? "No proposals have been created yet." : `No ${filter} proposals at the moment.`}
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredProposals.length} proposal{filteredProposals.length !== 1 ? "s" : ""}
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProposals.map((proposal) => (
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
        </div>
      )}
    </div>
  );
}



