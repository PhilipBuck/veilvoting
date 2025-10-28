"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVeilVoting } from "../../../hooks/useVeilVoting";
import { useWallet } from "../../../hooks/useWallet";

export default function CreateProposalPage() {
  const router = useRouter();
  const { address } = useWallet();
  const { createProposal } = useVeilVoting();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("300"); // 5 minutes for testing
  const [minVoters, setMinVoters] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      setError("At least 2 options required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createProposal(
        title,
        description,
        validOptions,
        parseInt(duration),
        parseInt(minVoters)
      );

      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-16">
        <p>Please connect your wallet to create a proposal</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Create New Proposal</h2>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl p-8 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter proposal title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter detailed description"
          />
        </div>

        {/* Options */}
        <div>
          <label className="block text-sm font-medium mb-2">Options</label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                required
                maxLength={50}
                className="flex-1 px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded-lg transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-700 dark:text-primary-300 rounded-lg transition-colors"
            >
              + Add Option
            </button>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium mb-2">Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="60">🧪 1 Minute (Testing)</option>
            <option value="300">🧪 5 Minutes (Testing)</option>
            <option value="3600">1 Hour</option>
            <option value="86400">1 Day</option>
            <option value="259200">3 Days</option>
            <option value="604800">7 Days</option>
          </select>
        </div>

        {/* Min Voters */}
        <div>
          <label className="block text-sm font-medium mb-2">Minimum Voters</label>
          <input
            type="number"
            value={minVoters}
            onChange={(e) => setMinVoters(e.target.value)}
            min="1"
            required
            className="w-full px-4 py-2 bg-white/50 dark:bg-neutral-900/50 border border-primary-200 dark:border-primary-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg font-medium shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Proposal"}
        </button>
      </form>
    </div>
  );
}


