import { expect } from "chai";
import { ethers, deployments } from "hardhat";
import { createMockInstance } from "@fhevm/mock-utils";
import type { VeilVoting } from "../types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VeilVoting (Mock)", function () {
  let contract: VeilVoting;
  let owner: HardhatEthersSigner;
  let voter1: HardhatEthersSigner;
  let voter2: HardhatEthersSigner;
  let voter3: HardhatEthersSigner;
  let mockInstance: any;

  before(async function () {
    // Create mock instance for encryption
    mockInstance = await createMockInstance();

    // Get signers
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy contract
    await deployments.fixture(["VeilVoting"]);
    const deployment = await deployments.get("VeilVoting");
    contract = await ethers.getContractAt(
      "VeilVoting",
      deployment.address
    ) as unknown as VeilVoting;

    console.log("✅ VeilVoting deployed at:", await contract.getAddress());
  });

  describe("Proposal Creation", function () {
    it("should create a proposal successfully", async function () {
      const tx = await contract.createProposal(
        "Test Proposal",
        "This is a test proposal",
        ["Option A", "Option B", "Option C"],
        3600, // 1 hour
        2 // min voters
      );

      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const proposalCount = await contract.proposalCount();
      expect(proposalCount).to.equal(1n);
    });

    it("should fail with invalid duration", async function () {
      await expect(
        contract.createProposal(
          "Invalid Proposal",
          "Too short duration",
          ["Yes", "No"],
          60, // Less than MIN_DURATION (1 hour)
          1
        )
      ).to.be.revertedWithCustomError(contract, "InvalidDuration");
    });

    it("should fail with too few options", async function () {
      await expect(
        contract.createProposal(
          "Invalid Proposal",
          "Only one option",
          ["Only Option"],
          3600,
          1
        )
      ).to.be.revertedWithCustomError(contract, "TooManyOptions");
    });

    it("should fail with too many options", async function () {
      const tooManyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);
      
      await expect(
        contract.createProposal(
          "Invalid Proposal",
          "Too many options",
          tooManyOptions,
          3600,
          1
        )
      ).to.be.revertedWithCustomError(contract, "TooManyOptions");
    });
  });

  describe("Voting", function () {
    let proposalId: bigint;

    before(async function () {
      // Create a test proposal
      const tx = await contract.createProposal(
        "Voting Test Proposal",
        "For voting tests",
        ["Agree", "Disagree", "Abstain"],
        7200, // 2 hours
        2
      );
      await tx.wait();
      
      const count = await contract.proposalCount();
      proposalId = count - 1n;
    });

    it("should allow voting with encrypted choice", async function () {
      // Voter1 votes for option 0 (Agree)
      const choice = 0;
      const { inputEuint8, inputProof } = await mockInstance.encrypt_uint8(choice);

      const tx = await contract.connect(voter1).vote(
        proposalId,
        inputEuint8,
        inputProof
      );
      
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      // Check that voter is marked as voted
      const voted = await contract.hasVoted(proposalId, voter1.address);
      expect(voted).to.be.true;

      // Check total voters increased
      const proposal = await contract.getProposal(proposalId);
      expect(proposal.totalVoters).to.equal(1);
    });

    it("should prevent double voting", async function () {
      const choice = 1;
      const { inputEuint8, inputProof } = await mockInstance.encrypt_uint8(choice);

      await expect(
        contract.connect(voter1).vote(proposalId, inputEuint8, inputProof)
      ).to.be.revertedWithCustomError(contract, "AlreadyVoted");
    });

    it("should allow multiple voters", async function () {
      // Voter2 votes for option 1 (Disagree)
      const choice2 = 1;
      const { inputEuint8: input2, inputProof: proof2 } = 
        await mockInstance.encrypt_uint8(choice2);

      const tx2 = await contract.connect(voter2).vote(
        proposalId,
        input2,
        proof2
      );
      await tx2.wait();

      // Voter3 votes for option 0 (Agree)
      const choice3 = 0;
      const { inputEuint8: input3, inputProof: proof3 } = 
        await mockInstance.encrypt_uint8(choice3);

      const tx3 = await contract.connect(voter3).vote(
        proposalId,
        input3,
        proof3
      );
      await tx3.wait();

      const proposal = await contract.getProposal(proposalId);
      expect(proposal.totalVoters).to.equal(3);
    });
  });

  describe("Result Revealing", function () {
    let proposalId: bigint;

    before(async function () {
      // Create a short-duration proposal for testing reveal
      const tx = await contract.createProposal(
        "Reveal Test Proposal",
        "For reveal tests",
        ["Yes", "No"],
        1, // 1 second (for quick testing)
        2
      );
      await tx.wait();
      
      const count = await contract.proposalCount();
      proposalId = count - 1n;

      // Vote with multiple accounts
      const { inputEuint8: input1, inputProof: proof1 } = 
        await mockInstance.encrypt_uint8(0); // Yes
      await contract.connect(voter1).vote(proposalId, input1, proof1);

      const { inputEuint8: input2, inputProof: proof2 } = 
        await mockInstance.encrypt_uint8(0); // Yes
      await contract.connect(voter2).vote(proposalId, input2, proof2);

      const { inputEuint8: input3, inputProof: proof3 } = 
        await mockInstance.encrypt_uint8(1); // No
      await contract.connect(voter3).vote(proposalId, input3, proof3);

      // Wait for proposal to end
      await new Promise(resolve => setTimeout(resolve, 1500));
    });

    it("should fail to reveal before voting ends", async function () {
      // Create another proposal
      const tx = await contract.createProposal(
        "Active Proposal",
        "Still active",
        ["A", "B"],
        3600,
        1
      );
      await tx.wait();
      
      const count = await contract.proposalCount();
      const activeProposalId = count - 1n;

      await expect(
        contract.revealResult(activeProposalId)
      ).to.be.revertedWithCustomError(contract, "ProposalNotActive");
    });

    it("should reveal results successfully", async function () {
      const tx = await contract.revealResult(proposalId);
      const receipt = await tx.wait();
      expect(receipt).to.not.be.null;

      const proposal = await contract.getProposal(proposalId);
      expect(proposal.isRevealed).to.be.true;
    });

    it("should fail to reveal already revealed proposal", async function () {
      await expect(
        contract.revealResult(proposalId)
      ).to.be.revertedWithCustomError(contract, "AlreadyRevealed");
    });

    it("should get encrypted vote counts", async function () {
      const option0Votes = await contract.getOptionVotes(proposalId, 0);
      const option1Votes = await contract.getOptionVotes(proposalId, 1);

      expect(option0Votes).to.not.be.null;
      expect(option1Votes).to.not.be.null;
    });
  });

  describe("Personal Vote Revealing", function () {
    let proposalId: bigint;

    before(async function () {
      // Create proposal
      const tx = await contract.createProposal(
        "Personal Reveal Test",
        "Test personal vote reveal",
        ["Choice 1", "Choice 2"],
        1,
        1
      );
      await tx.wait();
      
      const count = await contract.proposalCount();
      proposalId = count - 1n;

      // Vote
      const { inputEuint8, inputProof } = await mockInstance.encrypt_uint8(1);
      await contract.connect(voter1).vote(proposalId, inputEuint8, inputProof);

      // Wait for end
      await new Promise(resolve => setTimeout(resolve, 1500));
    });

    it("should allow voter to reveal their own vote", async function () {
      const myVote = await contract.connect(voter1).revealMyVote(proposalId);
      expect(myVote).to.not.be.null;
    });

    it("should fail if voter hasn't voted", async function () {
      await expect(
        contract.connect(voter2).revealMyVote(proposalId)
      ).to.be.revertedWithCustomError(contract, "NotVoted");
    });
  });

  describe("View Functions", function () {
    it("should get proposal details", async function () {
      const proposal = await contract.getProposal(0);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.options.length).to.equal(3);
    });

    it("should check if proposal is active", async function () {
      // Create new proposal
      const tx = await contract.createProposal(
        "Active Check",
        "Check active status",
        ["A", "B"],
        3600,
        1
      );
      await tx.wait();
      
      const count = await contract.proposalCount();
      const proposalId = count - 1n;

      const active = await contract.isActive(proposalId);
      expect(active).to.be.true;
    });
  });
});


