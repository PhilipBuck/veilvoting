// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint8, euint32, ebool, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title VeilVoting
 * @notice Privacy-preserving voting system using FHEVM
 * @dev All votes are encrypted on-chain, results revealed after voting ends
 */
contract VeilVoting is SepoliaConfig {
    // Errors
    error ProposalNotActive();
    error ProposalEnded();
    error AlreadyVoted();
    error NotVoted();
    error InvalidOption();
    error QuorumNotMet();
    error AlreadyRevealed();
    error InvalidDuration();
    error TooManyOptions();

    // Constants
    uint8 public constant MAX_OPTIONS = 10;
    uint32 public constant MIN_DURATION = 1 minutes;  // Changed for testing: 1 minute instead of 1 hour
    uint32 public constant MAX_DURATION = 30 days;

    // Structs
    struct Proposal {
        uint256 id;
        address creator;
        string title;
        string description;
        string[] options;
        uint256 startTime;
        uint256 endTime;
        uint32 minVoters;
        uint32 totalVoters;
        bool isRevealed;
        uint8 optionCount;
    }

    // State variables
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    
    // Encrypted vote counts for each option
    mapping(uint256 => mapping(uint8 => euint32)) private encryptedVotes;
    
    // Track if address has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Store each voter's encrypted choice for personal reveal
    mapping(uint256 => mapping(address => euint8)) private voterChoices;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        string title,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 timestamp
    );

    event ResultRevealed(
        uint256 indexed proposalId,
        address indexed revealer,
        uint256 timestamp
    );

    /**
     * @notice Create a new proposal
     * @param title Proposal title (max 100 chars)
     * @param description Proposal description (can be IPFS hash)
     * @param options Array of voting options (2-10 options)
     * @param duration Voting duration in seconds
     * @param minVoters Minimum voters required for quorum
     */
    function createProposal(
        string memory title,
        string memory description,
        string[] memory options,
        uint256 duration,
        uint32 minVoters
    ) external returns (uint256) {
        if (duration < MIN_DURATION || duration > MAX_DURATION) {
            revert InvalidDuration();
        }
        if (options.length < 2 || options.length > MAX_OPTIONS) {
            revert TooManyOptions();
        }

        uint256 proposalId = proposalCount++;
        
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.creator = msg.sender;
        p.title = title;
        p.description = description;
        p.options = options;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + duration;
        p.minVoters = minVoters;
        p.totalVoters = 0;
        p.isRevealed = false;
        p.optionCount = uint8(options.length);

        // Initialize encrypted vote counts to 0
        for (uint8 i = 0; i < options.length; i++) {
            encryptedVotes[proposalId][i] = FHE.asEuint32(0);
            FHE.allowThis(encryptedVotes[proposalId][i]);
        }

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            p.startTime,
            p.endTime
        );

        return proposalId;
    }

    /**
     * @notice Cast an encrypted vote
     * @param proposalId ID of the proposal
     * @param inputEuint8 Encrypted choice (option index)
     * @param inputProof Input proof for encryption
     */
    function vote(
        uint256 proposalId,
        externalEuint8 inputEuint8,
        bytes calldata inputProof
    ) external {
        Proposal storage p = proposals[proposalId];
        
        if (block.timestamp >= p.endTime) {
            revert ProposalEnded();
        }
        if (hasVoted[proposalId][msg.sender]) {
            revert AlreadyVoted();
        }

        // Convert external encrypted input to internal encrypted value
        euint8 encryptedChoice = FHE.fromExternal(inputEuint8, inputProof);
        
        // Store voter's choice for later personal reveal
        voterChoices[proposalId][msg.sender] = encryptedChoice;
        FHE.allowThis(voterChoices[proposalId][msg.sender]);

        // Count the vote for each option using homomorphic operations
        _countVote(proposalId, encryptedChoice, p.optionCount);

        // Mark as voted
        hasVoted[proposalId][msg.sender] = true;
        p.totalVoters++;

        emit VoteCast(proposalId, msg.sender, block.timestamp);
    }

    /**
     * @notice Internal function to count encrypted votes
     * @dev Uses FHE operations to maintain vote privacy
     */
    function _countVote(
        uint256 proposalId,
        euint8 encryptedChoice,
        uint8 optionCount
    ) internal {
        for (uint8 i = 0; i < optionCount; i++) {
            // Check if vote equals this option
            ebool isThisOption = FHE.eq(encryptedChoice, FHE.asEuint8(i));
            
            // If match, increment by 1, else by 0
            euint32 increment = FHE.select(
                isThisOption,
                FHE.asEuint32(1),
                FHE.asEuint32(0)
            );
            
            // Add to encrypted vote count
            encryptedVotes[proposalId][i] = FHE.add(
                encryptedVotes[proposalId][i],
                increment
            );
            
            FHE.allowThis(encryptedVotes[proposalId][i]);
        }
    }

    /**
     * @notice Reveal voting results (anyone can trigger after voting ends)
     * @param proposalId ID of the proposal
     */
    function revealResult(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        
        if (block.timestamp < p.endTime) {
            revert ProposalNotActive();
        }
        if (p.isRevealed) {
            revert AlreadyRevealed();
        }
        if (p.totalVoters < p.minVoters) {
            revert QuorumNotMet();
        }

        // Allow anyone to decrypt the results
        for (uint8 i = 0; i < p.optionCount; i++) {
            FHE.allow(encryptedVotes[proposalId][i], msg.sender);
        }

        p.isRevealed = true;

        emit ResultRevealed(proposalId, msg.sender, block.timestamp);
    }

    /**
     * @notice Allow user to reveal their own vote after voting ends
     * @param proposalId ID of the proposal
     * @return Encrypted choice (caller can decrypt using userDecrypt)
     */
    function revealMyVote(uint256 proposalId) external returns (euint8) {
        Proposal storage p = proposals[proposalId];
        
        if (block.timestamp < p.endTime) {
            revert ProposalNotActive();
        }
        if (!hasVoted[proposalId][msg.sender]) {
            revert NotVoted();
        }

        euint8 myVote = voterChoices[proposalId][msg.sender];
        
        // Allow caller to decrypt their own vote
        FHE.allow(myVote, msg.sender);
        
        return myVote;
    }

    /**
     * @notice Get encrypted vote count for a specific option
     * @param proposalId ID of the proposal
     * @param optionIndex Index of the option
     * @return Encrypted vote count (only decryptable if results revealed)
     */
    function getOptionVotes(
        uint256 proposalId,
        uint8 optionIndex
    ) external view returns (euint32) {
        Proposal storage p = proposals[proposalId];
        if (optionIndex >= p.optionCount) {
            revert InvalidOption();
        }
        return encryptedVotes[proposalId][optionIndex];
    }

    /**
     * @notice Get proposal details
     * @param proposalId ID of the proposal
     */
    function getProposal(uint256 proposalId) external view returns (
        address creator,
        string memory title,
        string memory description,
        string[] memory options,
        uint256 startTime,
        uint256 endTime,
        uint32 totalVoters,
        uint32 minVoters,
        bool isRevealed
    ) {
        Proposal storage p = proposals[proposalId];
        return (
            p.creator,
            p.title,
            p.description,
            p.options,
            p.startTime,
            p.endTime,
            p.totalVoters,
            p.minVoters,
            p.isRevealed
        );
    }

    /**
     * @notice Check if proposal is currently active
     * @param proposalId ID of the proposal
     */
    function isActive(uint256 proposalId) external view returns (bool) {
        Proposal storage p = proposals[proposalId];
        return block.timestamp >= p.startTime && block.timestamp < p.endTime;
    }
}

