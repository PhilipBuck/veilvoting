import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

task("veil:reveal", "Reveal proposal results")
  .addParam("proposalid", "Proposal ID to reveal")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments, network } = hre;
    
    console.log("\n🔓 Revealing Proposal Results...\n");

    const deployment = await deployments.get("VeilVoting");
    const contract = await ethers.getContractAt("VeilVoting", deployment.address);

    const [signer] = await ethers.getSigners();
    const proposalId = parseInt(taskArgs.proposalid);

    // Get proposal details
    const proposal = await contract.getProposal(proposalId);
    console.log(`📋 Proposal: ${proposal.title}`);
    console.log(`👥 Total Voters: ${proposal.totalVoters}`);
    console.log(`✅ Min Voters: ${proposal.minVoters}`);
    console.log(`⏰ End Time: ${new Date(Number(proposal.endTime) * 1000).toLocaleString()}`);

    // Check if proposal has ended
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime < Number(proposal.endTime)) {
      console.log(`\n❌ Error: Proposal has not ended yet!`);
      console.log(`⏳ Time remaining: ${Math.floor((Number(proposal.endTime) - currentTime) / 60)} minutes\n`);
      return;
    }

    // Check if already revealed
    if (proposal.isRevealed) {
      console.log(`\n✅ Results already revealed!`);
    } else {
      // Reveal results
      console.log(`🔐 Revealing results...`);
      const tx = await contract.revealResult(proposalId);
      console.log(`⏳ Transaction submitted: ${tx.hash}`);
      await tx.wait();
      console.log(`✅ Results revealed successfully!\n`);
    }

    // Decrypt results (Mock mode only for CLI)
    const isMock = network.config.chainId === 31337;
    
    if (isMock) {
      console.log(`📊 Vote Results:\n`);
      
      const { createMockInstance } = await import("@fhevm/mock-utils");
      const mockInstance = await createMockInstance();

      for (let i = 0; i < proposal.options.length; i++) {
        const encryptedVotes = await contract.getOptionVotes(proposalId, i);
        const votes = await mockInstance.decrypt(encryptedVotes);
        
        const percentage = proposal.totalVoters > 0
          ? ((Number(votes) / Number(proposal.totalVoters)) * 100).toFixed(2)
          : "0.00";

        console.log(`  ${i}. ${proposal.options[i]}`);
        console.log(`     Votes: ${votes} (${percentage}%)`);
      }
      console.log();
    } else {
      console.log(`\nℹ️  Use the web interface to view decrypted results on Sepolia\n`);
    }
  });


