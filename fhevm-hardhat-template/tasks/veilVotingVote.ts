import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

task("veil:vote", "Cast a vote on a proposal")
  .addParam("proposalid", "Proposal ID to vote on")
  .addParam("choice", "Choice index (0, 1, 2, ...)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, network } = hre;
    
    console.log("\n🗳️  Casting Vote...\n");

    const deployment = await deployments.get("VeilVoting");
    const contract = await ethers.getContractAt("VeilVoting", deployment.address);

    const [signer] = await ethers.getSigners();
    console.log(`👤 Voter: ${signer.address}`);

    const proposalId = parseInt(taskArgs.proposalid);
    const choice = parseInt(taskArgs.choice);

    // Check if already voted
    const hasVoted = await contract.hasVoted(proposalId, signer.address);
    if (hasVoted) {
      console.log(`❌ Error: You have already voted on this proposal!\n`);
      return;
    }

    // Get proposal details
    const proposal = await contract.getProposal(proposalId);
    console.log(`📋 Proposal: ${proposal.title}`);
    console.log(`🔗 Options: ${proposal.options.join(", ")}`);

    if (choice >= proposal.options.length) {
      console.log(`❌ Error: Invalid choice! Must be between 0 and ${proposal.options.length - 1}\n`);
      return;
    }

    console.log(`✅ Your choice: ${proposal.options[choice]}`);

    // Encrypt vote based on network
    const isMock = network.config.chainId === 31337;
    
    if (isMock) {
      console.log(`🔐 Encrypting vote (Mock mode)...`);
      const { createMockInstance } = await import("@fhevm/mock-utils");
      const mockInstance = await createMockInstance();
      
      const { inputEuint8, inputProof } = await mockInstance.encrypt_uint8(choice);
      
      const tx = await contract.vote(proposalId, inputEuint8, inputProof);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      await tx.wait();
    } else {
      console.log(`❌ Error: Relayer SDK voting not implemented in CLI task`);
      console.log(`Please use the web interface for Sepolia network\n`);
      return;
    }

    console.log(`\n✅ Vote cast successfully!`);
    console.log(`🆔 Proposal ID: ${proposalId}`);
    console.log(`🎯 Choice: ${proposal.options[choice]}\n`);
  });


