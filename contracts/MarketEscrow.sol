// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MarketEscrow
 * @notice Escrow contract for prediction market launch fees
 * @dev Collects fees when markets are launched and holds them until resolution
 */
contract MarketEscrow is Ownable, ReentrancyGuard {
    // Market fee structure
    struct MarketFee {
        uint256 launchFee;          // Fee to launch market
        uint256 tradingFee;         // Fee percentage for trades (basis points)
        uint256 resolutionFee;      // Fee for market resolution
    }

    // Market escrow data
    struct EscrowData {
        bytes32 marketId;
        bytes32 proposalId;
        address creator;
        uint256 feePaid;
        uint256 collectedTradingFees;
        uint256 timestamp;
        bool resolved;
        bool refunded;
    }

    // Fee configuration
    MarketFee public marketFee;
    
    // Escrow storage
    mapping(bytes32 => EscrowData) public escrows;
    mapping(address => bytes32[]) public userMarkets;
    
    // Treasury
    address public treasury;
    uint256 public totalFeesCollected;
    uint256 public totalFeesWithdrawn;
    
    // Constants
    uint256 public constant BASIS_POINTS = 10000; // 100% = 10000 basis points
    uint256 public constant MIN_LAUNCH_FEE = 0.001 ether; // 0.001 ADI
    uint256 public constant MAX_LAUNCH_FEE = 10 ether; // 10 ADI
    uint256 public constant MAX_TRADING_FEE = 500; // 5% max

    // Events
    event MarketLaunched(
        bytes32 indexed marketId,
        bytes32 indexed proposalId,
        address indexed creator,
        uint256 feePaid
    );
    
    event TradingFeeCollected(
        bytes32 indexed marketId,
        uint256 amount
    );
    
    event MarketResolved(
        bytes32 indexed marketId,
        bool refunded
    );
    
    event FeesWithdrawn(
        address indexed to,
        uint256 amount
    );
    
    event FeeConfigUpdated(
        uint256 launchFee,
        uint256 tradingFee,
        uint256 resolutionFee
    );

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        
        // Default fees
        marketFee = MarketFee({
            launchFee: 0.01 ether,     // 0.01 ADI to launch
            tradingFee: 30,             // 0.3% trading fee (30 basis points)
            resolutionFee: 0.001 ether  // 0.001 ADI for resolution
        });
    }

    /**
     * @notice Launch a prediction market by paying the launch fee
     * @param marketId Unique market identifier
     * @param proposalId Associated proposal ID
     */
    function launchMarket(
        bytes32 marketId,
        bytes32 proposalId
    ) external payable nonReentrant {
        require(marketId != bytes32(0), "Invalid market ID");
        require(proposalId != bytes32(0), "Invalid proposal ID");
        require(escrows[marketId].timestamp == 0, "Market already launched");
        require(msg.value >= marketFee.launchFee, "Insufficient launch fee");

        // Store escrow data
        escrows[marketId] = EscrowData({
            marketId: marketId,
            proposalId: proposalId,
            creator: msg.sender,
            feePaid: msg.value,
            collectedTradingFees: 0,
            timestamp: block.timestamp,
            resolved: false,
            refunded: false
        });

        // Track user's markets
        userMarkets[msg.sender].push(marketId);

        // Update total fees
        totalFeesCollected += msg.value;

        emit MarketLaunched(marketId, proposalId, msg.sender, msg.value);

        // Refund excess payment
        if (msg.value > marketFee.launchFee) {
            uint256 refund = msg.value - marketFee.launchFee;
            (bool success, ) = payable(msg.sender).call{value: refund}("");
            require(success, "Refund failed");
        }
    }

    /**
     * @notice Collect trading fees for a market
     * @param marketId Market identifier
     */
    function collectTradingFee(bytes32 marketId) external payable nonReentrant {
        require(escrows[marketId].timestamp > 0, "Market not found");
        require(!escrows[marketId].resolved, "Market already resolved");
        require(msg.value > 0, "No fee provided");

        escrows[marketId].collectedTradingFees += msg.value;
        totalFeesCollected += msg.value;

        emit TradingFeeCollected(marketId, msg.value);
    }

    /**
     * @notice Resolve market and handle fees
     * @param marketId Market identifier
     * @param refundCreator Whether to refund the creator's launch fee
     */
    function resolveMarket(
        bytes32 marketId,
        bool refundCreator
    ) external onlyOwner nonReentrant {
        EscrowData storage escrow = escrows[marketId];
        require(escrow.timestamp > 0, "Market not found");
        require(!escrow.resolved, "Already resolved");

        escrow.resolved = true;
        escrow.refunded = refundCreator;

        if (refundCreator) {
            // Refund launch fee to creator
            uint256 refundAmount = escrow.feePaid;
            totalFeesCollected -= refundAmount;
            
            (bool success, ) = payable(escrow.creator).call{value: refundAmount}("");
            require(success, "Refund failed");
        }

        emit MarketResolved(marketId, refundCreator);
    }

    /**
     * @notice Withdraw collected fees to treasury
     * @param amount Amount to withdraw
     */
    function withdrawFees(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Invalid amount");
        uint256 available = totalFeesCollected - totalFeesWithdrawn;
        require(amount <= available, "Insufficient balance");

        totalFeesWithdrawn += amount;

        (bool success, ) = payable(treasury).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit FeesWithdrawn(treasury, amount);
    }

    /**
     * @notice Update fee configuration
     * @param _launchFee New launch fee
     * @param _tradingFee New trading fee (basis points)
     * @param _resolutionFee New resolution fee
     */
    function updateFees(
        uint256 _launchFee,
        uint256 _tradingFee,
        uint256 _resolutionFee
    ) external onlyOwner {
        require(_launchFee >= MIN_LAUNCH_FEE && _launchFee <= MAX_LAUNCH_FEE, "Invalid launch fee");
        require(_tradingFee <= MAX_TRADING_FEE, "Trading fee too high");

        marketFee.launchFee = _launchFee;
        marketFee.tradingFee = _tradingFee;
        marketFee.resolutionFee = _resolutionFee;

        emit FeeConfigUpdated(_launchFee, _tradingFee, _resolutionFee);
    }

    /**
     * @notice Update treasury address
     * @param _treasury New treasury address
     */
    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Get market escrow data
     * @param marketId Market identifier
     */
    function getMarketEscrow(bytes32 marketId) external view returns (
        address creator,
        uint256 feePaid,
        uint256 collectedTradingFees,
        uint256 timestamp,
        bool resolved,
        bool refunded
    ) {
        EscrowData storage escrow = escrows[marketId];
        return (
            escrow.creator,
            escrow.feePaid,
            escrow.collectedTradingFees,
            escrow.timestamp,
            escrow.resolved,
            escrow.refunded
        );
    }

    /**
     * @notice Get user's launched markets
     * @param user User address
     */
    function getUserMarkets(address user) external view returns (bytes32[] memory) {
        return userMarkets[user];
    }

    /**
     * @notice Get available balance for withdrawal
     */
    function getAvailableBalance() external view returns (uint256) {
        return totalFeesCollected - totalFeesWithdrawn;
    }

    /**
     * @notice Calculate trading fee for an amount
     * @param amount Trade amount
     */
    function calculateTradingFee(uint256 amount) external view returns (uint256) {
        return (amount * marketFee.tradingFee) / BASIS_POINTS;
    }

    /**
     * @notice Get current fee configuration
     */
    function getFeeConfig() external view returns (
        uint256 launchFee,
        uint256 tradingFee,
        uint256 resolutionFee
    ) {
        return (
            marketFee.launchFee,
            marketFee.tradingFee,
            marketFee.resolutionFee
        );
    }

    /**
     * @notice Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }

    // Receive function to accept ADI
    receive() external payable {
        totalFeesCollected += msg.value;
    }
}
