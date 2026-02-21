// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RepairTimelineMarket
/// @notice Parimutuel YES/NO prediction market for repair completion deadlines (native ADI collateral).
contract RepairTimelineMarket {
    struct Market {
        bytes32 marketId;
        bytes32 proposalId;
        bytes32 propertyId;
        uint256 approvalTime;      // DAO approval timestamp
        uint256 repairDeadline;    // approvalTime + 10 days (or demo compressed)
        uint256 tradingDeadline;   // bets close before/at repair deadline
        uint256 yesPool;
        uint256 noPool;
        bool exists;
        bool resolved;
        bool outcomeYes;           // true => repair completed within deadline
        bool cancelled;
        address creator;           // backend/admin/DAO caller
    }

    address public owner;
    address public resolver;       // RepairVerificationResolver contract
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public tradingFeeBps = 100; // 1%
    uint256 public treasuryFeesAccrued;  // collected in native ADI
    uint256 public minStake = 0.0001 ether;

    mapping(bytes32 => Market) public markets;
    mapping(bytes32 => mapping(address => uint256)) public yesStake;
    mapping(bytes32 => mapping(address => uint256)) public noStake;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;

    event MarketCreated(
        bytes32 indexed marketId,
        bytes32 indexed proposalId,
        bytes32 indexed propertyId,
        uint256 approvalTime,
        uint256 repairDeadline,
        uint256 tradingDeadline
    );

    event Staked(
        bytes32 indexed marketId,
        address indexed user,
        bool indexed yesSide,
        uint256 grossAmount,
        uint256 feeAmount,
        uint256 netAmount
    );

    event MarketResolved(bytes32 indexed marketId, bool outcomeYes);
    event MarketCancelled(bytes32 indexed marketId, string reason);
    event Claimed(bytes32 indexed marketId, address indexed user, uint256 payout);
    event ResolverUpdated(address indexed resolver);
    event FeeUpdated(uint256 feeBps);
    event MinStakeUpdated(uint256 minStake);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "Not resolver");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }

    // ---------------------------
    // Admin setup
    // ---------------------------

    function setResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "Invalid resolver");
        resolver = _resolver;
        emit ResolverUpdated(_resolver);
    }

    function setTradingFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // max 10% for safety
        tradingFeeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        require(_minStake > 0, "Invalid min stake");
        minStake = _minStake;
        emit MinStakeUpdated(_minStake);
    }

    function withdrawTreasuryFees(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= treasuryFeesAccrued, "Exceeds treasury fees");
        treasuryFeesAccrued -= amount;

        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Withdraw failed");
        emit TreasuryWithdrawn(to, amount);
    }

    // ---------------------------
    // Market creation
    // ---------------------------

    /// @notice Create a market after DAO proposal approval.
    /// @dev marketId should usually come from your DAO metadata (deterministic).
    function createMarket(
        bytes32 marketId,
        bytes32 proposalId,
        bytes32 propertyId,
        uint256 approvalTime,
        uint256 repairDeadline,
        uint256 tradingDeadline
    ) external onlyOwner {
        require(!markets[marketId].exists, "Market exists");
        require(marketId != bytes32(0), "Invalid marketId");
        require(proposalId != bytes32(0), "Invalid proposalId");
        require(propertyId != bytes32(0), "Invalid propertyId");
        require(approvalTime > 0, "Invalid approvalTime");
        require(repairDeadline > approvalTime, "Bad repair deadline");
        require(tradingDeadline >= block.timestamp, "Trading deadline in past");
        require(tradingDeadline <= repairDeadline, "Trading ends after repair deadline");

        markets[marketId] = Market({
            marketId: marketId,
            proposalId: proposalId,
            propertyId: propertyId,
            approvalTime: approvalTime,
            repairDeadline: repairDeadline,
            tradingDeadline: tradingDeadline,
            yesPool: 0,
            noPool: 0,
            exists: true,
            resolved: false,
            outcomeYes: false,
            cancelled: false,
            creator: msg.sender
        });

        emit MarketCreated(
            marketId,
            proposalId,
            propertyId,
            approvalTime,
            repairDeadline,
            tradingDeadline
        );
    }

    // ---------------------------
    // Staking (prediction)
    // ---------------------------

    function stakeYes(bytes32 marketId) external payable {
        _stake(marketId, true);
    }

    function stakeNo(bytes32 marketId) external payable {
        _stake(marketId, false);
    }

    function _stake(bytes32 marketId, bool yesSide) internal {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        require(!m.cancelled, "Market cancelled");
        require(!m.resolved, "Market resolved");
        require(block.timestamp <= m.tradingDeadline, "Trading closed");
        require(msg.value >= minStake, "Below min stake");

        uint256 fee = (msg.value * tradingFeeBps) / BPS_DENOMINATOR;
        uint256 net = msg.value - fee;
        require(net > 0, "Net zero");

        treasuryFeesAccrued += fee;

        if (yesSide) {
            yesStake[marketId][msg.sender] += net;
            m.yesPool += net;
        } else {
            noStake[marketId][msg.sender] += net;
            m.noPool += net;
        }

        emit Staked(marketId, msg.sender, yesSide, msg.value, fee, net);
    }

    // ---------------------------
    // Resolution (resolver-only)
    // ---------------------------

    function resolveMarket(bytes32 marketId, bool outcomeYes_) external onlyResolver {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        require(!m.cancelled, "Market cancelled");
        require(!m.resolved, "Already resolved");
        require(block.timestamp >= m.tradingDeadline, "Trading not ended");

        m.resolved = true;
        m.outcomeYes = outcomeYes_;

        emit MarketResolved(marketId, outcomeYes_);
    }

    /// @notice Optional safety valve for admin if proposal/market becomes invalid in demo.
    function cancelMarket(bytes32 marketId, string calldata reason) external onlyOwner {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        require(!m.resolved, "Already resolved");
        require(!m.cancelled, "Already cancelled");

        m.cancelled = true;
        emit MarketCancelled(marketId, reason);
    }

    // ---------------------------
    // Claims
    // ---------------------------

    function claim(bytes32 marketId) external {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        require(!hasClaimed[marketId][msg.sender], "Already claimed");

        uint256 payout;

        if (m.cancelled) {
            // Refund both sides in full (net staked amounts only)
            payout = yesStake[marketId][msg.sender] + noStake[marketId][msg.sender];
            require(payout > 0, "Nothing to claim");

            hasClaimed[marketId][msg.sender] = true;
            yesStake[marketId][msg.sender] = 0;
            noStake[marketId][msg.sender] = 0;

            (bool okRefund, ) = payable(msg.sender).call{value: payout}("");
            require(okRefund, "Refund failed");

            emit Claimed(marketId, msg.sender, payout);
            return;
        }

        require(m.resolved, "Market not resolved");

        uint256 userWinningStake;
        uint256 totalWinningPool;
        uint256 totalPool = m.yesPool + m.noPool;

        if (m.outcomeYes) {
            userWinningStake = yesStake[marketId][msg.sender];
            totalWinningPool = m.yesPool;
        } else {
            userWinningStake = noStake[marketId][msg.sender];
            totalWinningPool = m.noPool;
        }

        require(userWinningStake > 0, "No winning stake");
        require(totalWinningPool > 0, "No winning pool");

        // Parimutuel payout: proportional share of total pool
        payout = (totalPool * userWinningStake) / totalWinningPool;

        hasClaimed[marketId][msg.sender] = true;

        // Zero user stakes to prevent weird edge cases / re-claims
        yesStake[marketId][msg.sender] = 0;
        noStake[marketId][msg.sender] = 0;

        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "Payout failed");

        emit Claimed(marketId, msg.sender, payout);
    }

    // ---------------------------
    // Views for frontend
    // ---------------------------

    function getPools(bytes32 marketId) external view returns (uint256 yesPool, uint256 noPool) {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        return (m.yesPool, m.noPool);
    }

    /// @notice Returns implied YES probability in basis points (0-10000)
    function getImpliedYesProbabilityBps(bytes32 marketId) external view returns (uint256) {
        Market storage m = markets[marketId];
        require(m.exists, "Market not found");
        uint256 total = m.yesPool + m.noPool;
        if (total == 0) return 5000; // neutral default
        return (m.yesPool * BPS_DENOMINATOR) / total;
    }

    function getUserPosition(bytes32 marketId, address user)
        external
        view
        returns (uint256 yesAmount, uint256 noAmount, bool claimed)
    {
        return (yesStake[marketId][user], noStake[marketId][user], hasClaimed[marketId][user]);
    }

    receive() external payable {}
}
