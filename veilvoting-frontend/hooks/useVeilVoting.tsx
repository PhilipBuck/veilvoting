"use client";

import { useMemo, useCallback } from "react";
import { Contract, BrowserProvider } from "ethers";
import { useWallet } from "./useWallet";
import { useFhevm } from "../fhevm/useFhevm";
import { VeilVotingABI } from "../abi/VeilVotingABI";
import { VeilVotingAddresses } from "../abi/VeilVotingAddresses";

export function useVeilVoting() {
  const { provider, chainId, address } = useWallet();
  const { instance: fhevmInstance } = useFhevm();

  const contractAddress = useMemo(() => {
    if (!chainId) return null;
    const key = chainId.toString() as keyof typeof VeilVotingAddresses;
    return VeilVotingAddresses[key]?.address || null;
  }, [chainId]);

  const contract = useMemo(() => {
    if (!provider || !contractAddress || !address) return null;

    const ethersProvider = new BrowserProvider(provider);
    return new Contract(contractAddress, VeilVotingABI.abi, ethersProvider) as any;
  }, [provider, contractAddress, address]);

  const createProposal = useCallback(
    async (
      title: string,
      description: string,
      options: string[],
      durationInSeconds: number,
      minVoters: number
    ) => {
      if (!contract || !address) throw new Error("Contract not initialized");

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.createProposal(
        title,
        description,
        options,
        durationInSeconds,
        minVoters
      );

      await tx.wait();
      return tx.hash;
    },
    [contract, address, provider]
  );

  const vote = useCallback(
    async (proposalId: number, choice: number) => {
      if (!contract || !fhevmInstance || !address || !contractAddress) {
        throw new Error("Contract or FHEVM not initialized");
      }

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      
      // Create encrypted input using FHEVM API
      const input = fhevmInstance.createEncryptedInput(contractAddress, address);
      input.add8(choice);
      
      // Encrypt the input
      const encryptedData = await input.encrypt();

      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.vote(
        proposalId,
        encryptedData.handles[0],
        encryptedData.inputProof
      );
      await tx.wait();

      return tx.hash;
    },
    [contract, fhevmInstance, address, provider, contractAddress]
  );

  const revealResult = useCallback(
    async (proposalId: number) => {
      if (!contract || !address) throw new Error("Contract not initialized");

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const contractWithSigner = contract.connect(signer);

      const tx = await contractWithSigner.revealResult(proposalId);
      await tx.wait();

      return tx.hash;
    },
    [contract, address, provider]
  );

  const getProposal = useCallback(
    async (proposalId: number) => {
      if (!contract) throw new Error("Contract not initialized");

      return await contract.getProposal(proposalId);
    },
    [contract]
  );

  const getProposalCount = useCallback(async () => {
    if (!contract) throw new Error("Contract not initialized");

    const count = await contract.proposalCount();
    return Number(count);
  }, [contract]);

  const hasVoted = useCallback(
    async (proposalId: number, voterAddress: string) => {
      if (!contract) throw new Error("Contract not initialized");

      return await contract.hasVoted(proposalId, voterAddress);
    },
    [contract]
  );

  const getOptionVotes = useCallback(
    async (proposalId: number, optionIndex: number) => {
      if (!contract) throw new Error("Contract not initialized");

      return await contract.getOptionVotes(proposalId, optionIndex);
    },
    [contract]
  );

  const decryptVotes = useCallback(
    async (encryptedHandle: string, signer: any) => {
      if (!fhevmInstance || !contractAddress || !address) {
        throw new Error("FHEVM not initialized");
      }

      try {
        // Import decryption utilities
        const { createDecryptionSignature, decryptHandles } = await import("../lib/fhevmDecrypt");
        
        // Create decryption signature
        const sig = await createDecryptionSignature(fhevmInstance, contractAddress, signer);
        
        // Decrypt the handle
        const results = await decryptHandles(
          fhevmInstance,
          [{ handle: encryptedHandle, contractAddress }],
          sig
        );
        
        return results[encryptedHandle];
      } catch (error) {
        console.error("Decryption failed:", error);
        throw error;
      }
    },
    [fhevmInstance, contractAddress, address]
  );

  return {
    contract,
    contractAddress,
    createProposal,
    vote,
    revealResult,
    getProposal,
    getProposalCount,
    hasVoted,
    getOptionVotes,
    decryptVotes,
  };
}

