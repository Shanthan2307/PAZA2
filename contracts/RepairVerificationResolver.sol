// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPredictionMarketDAO {
    function proposalExists(bytes32 proposalId) external view returns (bool);
    function proposalApprovedAt(bytes32 proposalId) external view returns (uint256);
    function getProposalMetadata(bytes32 proposalId) external view returns (
        bytes32 propertyId,
        bytes32 evidenceHash,
        uint8 verificationConfidence,
        uint8 issueType,
        uint8 severity,
        bytes32 marketId,
        uint256 resolutionDeadline,
        string memory ipfsCID,
        address proposer,
        uint256 createdAt,
        uint8 status
    );
}

interface IRepairTimelineMarket {
    function markets(bytes32 marketId) external view returns (
        bytes32 marketId_,
        bytes32 proposalId,
        bytes32 propertyId,
        uint256 approvalTime,
        uint256 repairDeadline,
        uint256 tradingDeadline,
        uint256 yesPool,
        uint256 noPool,
        bool exists,
        bool resolved,
        bool outcomeYes,
        bool cancelled,
        address creator
    );

    function resolveMarket(bytes32 marketId, bool outcomeYes) external;
}

contract RepairVerificationResolver {
    struct CompletionProof {
        bool submitted;
        bytes32 completionEvidenceHash;
        string completionIpfsCID;
        uint256 submittedAt;
        uint256 completionTimestamp; // when repair was completed (verified timestamp)
        address submitter;
    }

    address public owner;
    address public finalizer; // hackathon admin signer / trusted role
    IPredictionMarketDAO public dao;
    IRepairTimelineMarket public market;

    bool public challengeEnabled;
    uint256 public challengeBond = 0.001 ether;

    // proposalId => proof
    mapping(bytes32 => CompletionProof) public completionProofs;

    // proposalId => resolution state
    mapping(bytes32 => bool) public resolvedProposal;
    mapping(bytes32 => bool) public resolvedOutcomeYes;

    // proposalId => challenge
    mapping(bytes32 => bool) public challenged;
    mapping(bytes32 => address) public challenger;
    mapping(bytes32 => uint256) public challengeBondAmount;

    event CompletionProofSubmitted(
        bytes32 indexed proposalId,
        bytes32 indexed completionEvidenceHash,
        string completionIpfsCID,
        uint256 completionTimestamp,
        address indexed submitter
    );

    event ProposalResolved(
        bytes32 indexed proposalId,
        bytes32 indexed marketId,
        bool outcomeYes,
        uint256 repairDeadline,
        uint256 completionTimestamp
    );

    event NoCompletionResolved(
        bytes32 indexed proposalId,
        bytes32 indexed marketId,
        uint256 repairDeadline
    );

    event Challenged(bytes32 indexed proposalId, address indexed challenger, uint256 bondAmount);
    event ChallengeEnabledSet(bool enabled);
    event ChallengeBondUpdated(uint256 bond);
    event FinalizerUpdated(address indexed finalizer);
    event DAOUpdated(address indexed dao);
    event MarketUpdated(address indexed market);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyFinalizer() {
        require(msg.sender == finalizer, "Not finalizer");
        _;
    }

    constructor(address _dao, address _market, address _finalizer) {
        require(_dao != address(0) && _market != address(0) && _finalizer != address(0), "Zero address");
        owner = msg.sender;
        dao = IPredictionMarketDAO(_dao);
        market = IRepairTimelineMarket(_market);
        finalizer = _finalizer;
    }

    // ---------------------------
    // Admin config
    // ---------------------------

    function setFinalizer(address _finalizer) external onlyOwner {
        require(_finalizer != address(0), "Invalid finalizer");
        finalizer = _finalizer;
        emit FinalizerUpdated(_finalizer);
    }

    function setDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "Invalid DAO");
        dao = IPredictionMarketDAO(_dao);
        emit DAOUpdated(_dao);
    }

    function setMarket(address _market) external onlyOwner {
        require(_market != address(0), "Invalid market");
        market = IRepairTimelineMarket(_market);
        emit MarketUpdated(_market);
    }

    function setChallengeEnabled(bool enabled) external onlyOwner {
        challengeEnabled = enabled;
        emit ChallengeEnabledSet(enabled);
    }

    function setChallengeBond(uint256 bond) external onlyOwner {
        require(bond > 0, "Invalid bond");
        challengeBond = bond;
        emit ChallengeBondUpdated(bond);
    }

    // ---------------------------
    // Completion proof submission
    // ---------------------------

    /// @notice Submit proof that repair was completed.
    /// @dev `completionTimestamp` should reflect verified completion time, not submission time.
    function submitCompletionProof(
        bytes32 proposalId,
        bytes32 completionEvidenceHash,
        string calldata completionIpfsCID,
        uint256 completionTimestamp
    ) external {
        require(dao.proposalExists(proposalId), "Proposal not found");
        require(completionEvidenceHash != bytes32(0), "Invalid evidence hash");
        require(completionTimestamp > 0, "Invalid completion timestamp");

        CompletionProof storage p = completionProofs[proposalId];
        require(!p.submitted, "Proof already submitted");

        p.submitted = true;
        p.completionEvidenceHash = completionEvidenceHash;
        p.completionIpfsCID = completionIpfsCID;
        p.submittedAt = block.timestamp;
        p.completionTimestamp = completionTimestamp;
        p.submitter = msg.sender;

        emit CompletionProofSubmitted(
            proposalId,
            completionEvidenceHash,
            completionIpfsCID,
            completionTimestamp,
            msg.sender
        );
    }

    // ---------------------------
    // Optional challenge (hackathon bonus)
    // ---------------------------

    function challenge(bytes32 proposalId) external payable {
        require(challengeEnabled, "Challenge disabled");
        require(dao.proposalExists(proposalId), "Proposal not found");
        require(!resolvedProposal[proposalId], "Already resolved");
        require(!challenged[proposalId], "Already challenged");
        require(msg.value >= challengeBond, "Insufficient bond");

        challenged[proposalId] = true;
        challenger[proposalId] = msg.sender;
        challengeBondAmount[proposalId] = msg.value;

        emit Challenged(proposalId, msg.sender, msg.value);
    }

    // ---------------------------
    // Resolution
    // ---------------------------

    /// @notice Resolve based on submitted completion proof and market deadline.
    /// YES => completionTimestamp <= repairDeadline
    function resolveByProof(bytes32 proposalId) external onlyFinalizer {
        require(dao.proposalExists(proposalId), "Proposal not found");
        require(!resolvedProposal[proposalId], "Already resolved");
        require(!challenged[proposalId], "Proposal challenged");

        CompletionProof storage p = completionProofs[proposalId];
        require(p.submitted, "No completion proof");

        (
            bytes32 propertyId,
            ,
            ,
            ,
            ,
            bytes32 marketId,
            ,
            ,
            ,
            ,
        ) = dao.getProposalMetadata(proposalId);

        (
            ,
            bytes32 marketProposalId,
            bytes32 marketPropertyId,
            ,
            uint256 repairDeadline,
            ,
            ,
            ,
            bool exists,
            bool alreadyResolved,
            ,
            bool cancelled,
        ) = market.markets(marketId);

        require(exists, "Market missing");
        require(!cancelled, "Market cancelled");
        require(!alreadyResolved, "Market already resolved");
        require(marketProposalId == proposalId, "Proposal mismatch");
        require(marketPropertyId == propertyId, "Property mismatch");

        bool outcomeYes = p.completionTimestamp <= repairDeadline;

        resolvedProposal[proposalId] = true;
        resolvedOutcomeYes[proposalId] = outcomeYes;

        market.resolveMarket(marketId, outcomeYes);

        emit ProposalResolved(
            proposalId,
            marketId,
            outcomeYes,
            repairDeadline,
            p.completionTimestamp
        );
    }

    /// @notice Resolve NO if deadline passed and no valid completion proof exists.
    function resolveNoCompletion(bytes32 proposalId) external onlyFinalizer {
        require(dao.proposalExists(proposalId), "Proposal not found");
        require(!resolvedProposal[proposalId], "Already resolved");
        require(!challenged[proposalId], "Proposal challenged");

        (
            ,
            ,
            ,
            ,
            ,
            bytes32 marketId,
            ,
            ,
            ,
            ,
        ) = dao.getProposalMetadata(proposalId);

        (
            ,
            ,
            ,
            ,
            uint256 repairDeadline,
            ,
            ,
            ,
            bool exists,
            bool alreadyResolved,
            ,
            bool cancelled,
        ) = market.markets(marketId);

        require(exists, "Market missing");
        require(!cancelled, "Market cancelled");
        require(!alreadyResolved, "Market already resolved");
        require(block.timestamp > repairDeadline, "Repair deadline not passed");

        CompletionProof storage p = completionProofs[proposalId];
        if (p.submitted) {
            // If proof exists, use proof path to avoid accidentally forcing NO.
            revert("Proof exists; use resolveByProof");
        }

        resolvedProposal[proposalId] = true;
        resolvedOutcomeYes[proposalId] = false;

        market.resolveMarket(marketId, false);

        emit NoCompletionResolved(proposalId, marketId, repairDeadline);
    }

    /// @notice Owner can withdraw challenge bonds in MVP (or route later based on dispute result).
    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Withdraw failed");
    }

    receive() external payable {}
}
