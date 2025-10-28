import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

task("veil:create-proposal", "Create a test proposal for VeilVoting")
  .addOptionalParam("title", "Proposal title", "Test Proposal")
  .addOptionalParam("description", "Proposal description", "This is a test proposal for VeilVoting")
  .addOptionalParam("duration", "Duration in hours", "24")
  .addOptionalParam("minvoters", "Minimum voters required", "1")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre;
    
    console.log("\n🗳️  Creating VeilVoting Proposal...\n");

    const deployment = await deployments.get("VeilVoting");
    const contract = await ethers.getContractAt("VeilVoting", deployment.address);

    const [signer] = await ethers.getSigners();
    console.log(`📝 Using account: ${signer.address}`);

    const options = ["Agree", "Disagree", "Abstain"];
    const durationInSeconds = parseInt(taskArgs.duration) * 3600;

    const tx = await contract.createProposal(
      taskArgs.title,
      taskArgs.description,
      options,
      durationInSeconds,
      parseInt(taskArgs.minvoters)
    );

    console.log(`⏳ Transaction submitted: ${tx.hash}`);
    const receipt = await tx.wait();

    const proposalCount = await contract.proposalCount();
    const proposalId = proposalCount - 1n;

    console.log(`\n✅ Proposal created successfully!`);
    console.log(`🆔 Proposal ID: ${proposalId}`);
    console.log(`📋 Title: ${taskArgs.title}`);
    console.log(`⏰ Duration: ${taskArgs.duration} hours`);
    console.log(`👥 Min Voters: ${taskArgs.minvoters}`);
    console.log(`🔗 Options: ${options.join(", ")}\n`);
  });


