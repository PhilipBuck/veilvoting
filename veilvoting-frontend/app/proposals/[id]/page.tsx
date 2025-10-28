"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useVeilVoting } from "../../../hooks/useVeilVoting";
import { useWallet } from "../../../hooks/useWallet";
import { shortenAddress, calculateTimeRemaining } from "../../../lib/utils";

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = parseInt(params.id as string);
  
  const { address, provider } = useWallet();
  const { getProposal, vote, hasVoted, revealResult, getOptionVotes, decryptVotes } = useVeilVoting();
  
  const [proposal, setProposal] = useState<any>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (address && !isNaN(proposalId)) {
      loadProposal();
    }
  }, [address, proposalId]);

  async function loadProposal() {
    try {
      const data = await getProposal(proposalId);
      setProposal({
        id: proposalId,
        title: data.title,
        creator: data.creator,
        description: data.description,
        options: data.options,
        startTime: Number(data.startTime),
        endTime: Number(data.endTime),
        totalVoters: Number(data.totalVoters),
        minVoters: Number(data.minVoters),
        isRevealed: data.isRevealed,
      });

      const voted = await hasVoted(proposalId, address!);
      setAlreadyVoted(voted);

      // Don't auto-load results, wait for user to click "View Results"
    } catch (error) {
      console.error("Failed to load proposal:", error);
    }
  }

  async function loadResults() {
    if (!proposal || !provider || !address) {
      setError("Provider or address not available");
      return;
    }

    try {
      setIsLoadingResults(true);
      setError("");

      const { BrowserProvider } = await import("ethers");
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const resultsData = [];
      for (let i = 0; i < proposal.options.length; i++) {
        const encryptedHandle = await getOptionVotes(proposalId, i);
        const votes = await decryptVotes(encryptedHandle, signer);
        resultsData.push(Number(votes));
      }
      setResults(resultsData);
    } catch (error) {
      console.error("Failed to load results:", error);
      setError("Failed to decrypt voting results. Please try again.");
    } finally {
      setIsLoadingResults(false);
    }
  }

  async function handleVote() {
    if (selectedOption === null) {
      setError("Please select an option");
      return;
    }

    try {
      setIsVoting(true);
      setError("");
      await vote(proposalId, selectedOption);
      await loadProposal();
    } catch (err: any) {
      setError(err.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  }

  async function handleReveal() {
    try {
      setIsRevealing(true);
      setError("");
      await revealResult(proposalId);
      await loadProposal();
    } catch (err: any) {
      setError(err.message || "Failed to reveal results");
    } finally {
      setIsRevealing(false);
    }
  }

  if (!address) {
    return <div className="text-center py-16">Please connect your wallet</div>;
  }

  if (!proposal) {
    return <div className="text-center py-16">Loading...</div>;
  }

  const { isEnded, formatted } = calculateTimeRemaining(proposal.endTime);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isEnded ? "bg-neutral-500/20" : "bg-green-500/20 text-green-700 dark:text-green-300"
            }`}
          >
            {isEnded ? "Ended" : "Active"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-neutral-500">Creator:</span>{" "}
            <span className="font-mono">{shortenAddress(proposal.creator)}</span>
          </div>
          <div>
            <span className="text-neutral-500">Time Remaining:</span>{" "}
            <span className="font-medium">{formatted}</span>
          </div>
          <div>
            <span className="text-neutral-500">Voters:</span>{" "}
            <span className="font-medium">
              {proposal.totalVoters}/{proposal.minVoters}
            </span>
          </div>
        </div>

        <p className="text-neutral-700 dark:text-neutral-300 mb-8">{proposal.description}</p>

        {/* Voting Section */}
        {!isEnded && !alreadyVoted && (
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Cast Your Vote</h3>
            <div className="space-y-2 mb-4">
              {proposal.options.map((option: string, index: number) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedOption === index
                      ? "border-primary-500 bg-primary-500/10"
                      : "border-neutral-200 dark:border-neutral-700 hover:border-primary-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="option"
                    value={index}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                    className="mr-3"
                  />
                  <span className="font-medium">{option}</span>
                </label>
              ))}
            </div>
            {error && <div className="p-3 bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg mb-4">{error}</div>}
            <button
              onClick={handleVote}
              disabled={isVoting || selectedOption === null}
              className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isVoting ? "🔐 Encrypting & Submitting..." : "Cast Vote"}
            </button>
          </div>
        )}

        {alreadyVoted && !isEnded && (
          <div className="p-4 bg-green-500/20 text-green-700 dark:text-green-300 rounded-lg">
            ✅ You have already voted on this proposal
          </div>
        )}

        {/* Results Section */}
        {isEnded && !proposal.isRevealed && (
          <div className="text-center">
            <p className="mb-4">Voting has ended. Results can be revealed now.</p>
            {error && <div className="p-3 bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg mb-4">{error}</div>}
            <button
              onClick={handleReveal}
              disabled={isRevealing}
              className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {isRevealing ? "🔓 Revealing..." : "Reveal Results"}
            </button>
          </div>
        )}

        {proposal.isRevealed && (
          <div>
            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                  Results have been revealed. Click below to decrypt and view voting statistics.
                </p>
                {error && <div className="p-3 bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg mb-4">{error}</div>}
                <button
                  onClick={loadResults}
                  disabled={isLoadingResults}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {isLoadingResults ? "🔓 Decrypting..." : "🔓 View Results"}
                </button>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-4">Results</h3>
                <div className="space-y-3">
                  {proposal.options.map((option: string, index: number) => {
                    const votes = results[index] || 0;
                    const percentage =
                      proposal.totalVoters > 0 ? (votes / proposal.totalVoters) * 100 : 0;
                    return (
                      <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{option}</span>
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {votes} votes ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


