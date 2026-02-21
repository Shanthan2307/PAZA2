// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredictionMarketDAO {
    enum IssueType { ENVIRONMENTAL, INFRASTRUCTURE, HEALTHCARE, EDUCATION, HUMANITARIAN, ECONOMIC, SOCIAL }
    enum Severity { LOW, MEDIUM, HIGH, CRITICAL }
    enum ProposalStatus { PENDING, ACTIVE, EXECUTED, REJECTED, EXPIRED }

    struct ProposalMetadata {
        bytes32 proposalId;
        bytes32 propertyId;           // Unique identifier for the property/location
        bytes32 evidenceHash;         // IPFS hash of evidence
        uint8 verificationConfidence; // 0-100 confidence score
        IssueType issueType;
        Severity severity;
        bytes32 marketId;             // Associated prediction market ID
        uint256 resolutionDeadline;   // When the proposal outcome must be verified
        string ipfsCID;               // Full IPFS CID for detailed data
        address proposer;
        uint256 createdAt;
        ProposalStatus status;
    }

    struct ProposalVoting {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    struct ProposalDetails {
        string title;
        string description;
        string location;
        int256 latitude;
        int256 longitude;  // Stored as lat/lng * 1e6 for precision
        uint256 requestedAmount;
        address beneficiary;
    }

    // Main storage
    mapping(bytes32 => ProposalMetadata) public proposalMetadata;
    mapping(bytes32 => ProposalVoting) private proposalVoting;
    mapping(bytes32 => ProposalDetails) public proposalDetails;
    mapping(bytes32 => bool) public proposalExists;
    
    // Member management
    mapping(address => bool) public members;
    mapping(address => uint256) public memberStakes;
    
    // Prediction market integration
    address public owner;
    address public marketContract;
    address public resolverContract;
    mapping(bytes32 => uint256) public proposalApprovedAt;
    bytes32[] public allProposalIds;
    
    // Configurable periods (for demo mode)
    uint256 public votingPeriod;
    uint256 public resolutionPeriod;
    
    // Constants
    uint256 public constant QUORUM = 2;
    uint256 public constant MINIMUM_STAKE = 0.0001 ether;

    // Events
    event ProposalCreated(
        bytes32 indexed proposalId,
        bytes32 indexed propertyId,
        bytes32 evidenceHash,
        IssueType issueType,
        Severity severity,
        uint256 deadline,
        uint256 resolutionDeadline
    );
    
    event MarketInitialized(bytes32 indexed proposalId, bytes32 indexed marketId);
    event Voted(bytes32 indexed proposalId, address indexed voter, bool support);
    event ProposalExecuted(bytes32 indexed proposalId);
    event ProposalStatusChanged(bytes32 indexed proposalId, ProposalStatus newStatus);
    event MemberJoined(address indexed member, uint256 stake);
    event MemberLeft(address indexed member, uint256 stake);

    constructor(uint256 _votingPeriod, uint256 _resolutionPeriod) {
        owner = msg.sender;
        votingPeriod = _votingPeriod;
        resolutionPeriod = _resolutionPeriod;
        
        // Pre-configure members
        members[0x526557EF4B43a83aE2bD93FCE1592f3fB4ca1D45] = true;
        members[0x300de2001FE0dA13B2aF275C9cAAFF847A2b7CEe] = true;
        members[0x97EE6Bd44AA73ad966e0BA80432D8C71230beAE2] = true;
        members[0x385eF658a56E4819039553AF2d675427d190F912] = true;
        members[0x2B650F7565629b54fc476152e4aCbD9C1A4DEF9B] = true;
    }

    modifier onlyMember() {
        require(members[msg.sender], "Not a member");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // Owner functions for prediction market integration
    function setMarketContract(address _marketContract) external onlyOwner {
        require(_marketContract != address(0), "Invalid market");
        marketContract = _marketContract;
    }

    function setResolverContract(address _resolverContract) external onlyOwner {
        require(_resolverContract != address(0), "Invalid resolver");
        resolverContract = _resolverContract;
    }

    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        require(_votingPeriod > 0, "Invalid voting period");
        votingPeriod = _votingPeriod;
    }

    function setResolutionPeriod(uint256 _resolutionPeriod) external onlyOwner {
        require(_resolutionPeriod > 0, "Invalid resolution period");
        resolutionPeriod = _resolutionPeriod;
    }

    // Member management functions
    function joinDAO() external payable {
        require(!members[msg.sender], "Already a member");
        require(msg.value >= MINIMUM_STAKE, "Insufficient stake");
        
        members[msg.sender] = true;
        memberStakes[msg.sender] = msg.value;
        
        emit MemberJoined(msg.sender, msg.value);
    }

    function leaveDAO() external onlyMember {
        require(memberStakes[msg.sender] > 0, "No stake to withdraw");
        
        uint256 stake = memberStakes[msg.sender];
        members[msg.sender] = false;
        memberStakes[msg.sender] = 0;
        
        emit MemberLeft(msg.sender, stake);
        
        (bool success, ) = payable(msg.sender).call{value: stake}("");
        require(success, "Transfer failed");
    }

    // Create proposal with full metadata
    function createProposal(
        string calldata title,
        string calldata description,
        string calldata location,
        int256 latitude,
        int256 longitude,
        uint256 requestedAmount,
        address beneficiary,
        bytes32 propertyId,
        bytes32 evidenceHash,
        uint8 verificationConfidence,
        IssueType issueType,
        Severity severity,
        string calldata ipfsCID
    ) external onlyMember returns (bytes32) {
        require(verificationConfidence <= 100, "Invalid confidence score");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        // Generate unique proposal ID
        bytes32 proposalId = keccak256(
            abi.encodePacked(
                title,
                description,
                propertyId,
                evidenceHash,
                block.timestamp,
                msg.sender
            )
        );
        
        require(!proposalExists[proposalId], "Proposal already exists");
        
        // Generate market ID for prediction market
        bytes32 marketId = keccak256(abi.encodePacked(proposalId, "MARKET"));
        
        uint256 votingDeadline = block.timestamp + votingPeriod;
        uint256 resolutionDeadline = votingDeadline + resolutionPeriod;
        
        // Store metadata
        proposalMetadata[proposalId] = ProposalMetadata({
            proposalId: proposalId,
            propertyId: propertyId,
            evidenceHash: evidenceHash,
            verificationConfidence: verificationConfidence,
            issueType: issueType,
            severity: severity,
            marketId: marketId,
            resolutionDeadline: resolutionDeadline,
            ipfsCID: ipfsCID,
            proposer: msg.sender,
            createdAt: block.timestamp,
            status: ProposalStatus.ACTIVE
        });
        
        // Store voting data
        ProposalVoting storage voting = proposalVoting[proposalId];
        voting.deadline = votingDeadline;
        voting.executed = false;
        
        // Store details
        proposalDetails[proposalId] = ProposalDetails({
            title: title,
            description: description,
            location: location,
            latitude: latitude,
            longitude: longitude,
            requestedAmount: requestedAmount,
            beneficiary: beneficiary
        });
        
        proposalExists[proposalId] = true;
        allProposalIds.push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            propertyId,
            evidenceHash,
            issueType,
            severity,
            votingDeadline,
            resolutionDeadline
        );
        
        emit MarketInitialized(proposalId, marketId);
        
        return proposalId;
    }

    function vote(bytes32 proposalId, bool support) external onlyMember {
        require(proposalExists[proposalId], "Proposal doesn't exist");
        
        ProposalVoting storage voting = proposalVoting[proposalId];
        require(block.timestamp <= voting.deadline, "Voting period ended");
        require(!voting.hasVoted[msg.sender], "Already voted");
        
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        require(metadata.status == ProposalStatus.ACTIVE, "Proposal not active");
        
        voting.hasVoted[msg.sender] = true;
        if (support) {
            voting.forVotes += 1;
        } else {
            voting.againstVotes += 1;
        }
        
        emit Voted(proposalId, msg.sender, support);
    }

    function executeProposal(bytes32 proposalId) external onlyMember {
        require(proposalExists[proposalId], "Proposal doesn't exist");
        
        ProposalVoting storage voting = proposalVoting[proposalId];
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        
        require(!voting.executed, "Already executed");
        require(block.timestamp > voting.deadline, "Voting still in progress");
        require(voting.forVotes + voting.againstVotes >= QUORUM, "Quorum not reached");
        require(voting.forVotes > voting.againstVotes, "Proposal rejected");
        require(metadata.status == ProposalStatus.ACTIVE, "Proposal not active");
        
        voting.executed = true;
        metadata.status = ProposalStatus.EXECUTED;
        proposalApprovedAt[proposalId] = block.timestamp;
        
        emit ProposalExecuted(proposalId);
        emit ProposalStatusChanged(proposalId, ProposalStatus.EXECUTED);
    }

    // View functions
    function getProposalMetadata(bytes32 proposalId) external view returns (
        bytes32 propertyId,
        bytes32 evidenceHash,
        uint8 verificationConfidence,
        IssueType issueType,
        Severity severity,
        bytes32 marketId,
        uint256 resolutionDeadline,
        string memory ipfsCID,
        address proposer,
        uint256 createdAt,
        ProposalStatus status
    ) {
        ProposalMetadata storage metadata = proposalMetadata[proposalId];
        return (
            metadata.propertyId,
            metadata.evidenceHash,
            metadata.verificationConfidence,
            metadata.issueType,
            metadata.severity,
            metadata.marketId,
            metadata.resolutionDeadline,
            metadata.ipfsCID,
            metadata.proposer,
            metadata.createdAt,
            metadata.status
        );
    }

    function getProposalDetails(bytes32 proposalId) external view returns (
        string memory title,
        string memory description,
        string memory location,
        int256 latitude,
        int256 longitude,
        uint256 requestedAmount,
        address beneficiary
    ) {
        ProposalDetails storage details = proposalDetails[proposalId];
        return (
            details.title,
            details.description,
            details.location,
            details.latitude,
            details.longitude,
            details.requestedAmount,
            details.beneficiary
        );
    }

    function getProposalVoting(bytes32 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 deadline,
        bool executed
    ) {
        ProposalVoting storage voting = proposalVoting[proposalId];
        return (
            voting.forVotes,
            voting.againstVotes,
            voting.deadline,
            voting.executed
        );
    }

    function hasVoted(bytes32 proposalId, address voter) external view returns (bool) {
        return proposalVoting[proposalId].hasVoted[voter];
    }

    function isMember(address account) external view returns (bool) {
        return members[account];
    }

    function getMemberStake(address member) external view returns (uint256) {
        return memberStakes[member];
    }

    // Helper function to convert IssueType enum to string (for frontend)
    function getIssueTypeString(IssueType issueType) external pure returns (string memory) {
        if (issueType == IssueType.ENVIRONMENTAL) return "Environmental";
        if (issueType == IssueType.INFRASTRUCTURE) return "Infrastructure";
        if (issueType == IssueType.HEALTHCARE) return "Healthcare";
        if (issueType == IssueType.EDUCATION) return "Education";
        if (issueType == IssueType.HUMANITARIAN) return "Humanitarian";
        if (issueType == IssueType.ECONOMIC) return "Economic";
        if (issueType == IssueType.SOCIAL) return "Social";
        return "Unknown";
    }

    function getSeverityString(Severity severity) external pure returns (string memory) {
        if (severity == Severity.LOW) return "Low";
        if (severity == Severity.MEDIUM) return "Medium";
        if (severity == Severity.HIGH) return "High";
        if (severity == Severity.CRITICAL) return "Critical";
        return "Unknown";
    }

    // Additional view functions for prediction market integration
    function getAllProposalIds() external view returns (bytes32[] memory) {
        return allProposalIds;
    }

    function getProposalCount() external view returns (uint256) {
        return allProposalIds.length;
    }
}
